// 友链申请邮件处理脚本（由 GitHub Action 运行）
// 读取 /tmp/payload.json，发送邮件 + 飞书通知
const nm = require('nodemailer');
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('/tmp/payload.json', 'utf8'));
const SITE = 'https://blog.oopss.top';
const APPLY_URL = SITE + '/friends/apply';

async function main() {
  const t = nm.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD},
  });
  const feishuMsgs = [];
  for (const e of (p.emails || [])) {
    const a = e.app || {};
    const params = new URLSearchParams({
      name: a.name || '', website: a.website || '', friendLink: a.friendLink || '',
      rss: a.rss || '', email: a.email || '', description: a.description || '',
      avatarUrl: a.avatar || '',
    }).toString();
    const reapplyUrl = APPLY_URL + '?' + params;
    const au = 'https://apii.oopss.top/api/friend-apply/approve?token=' + (a.id || '');
    const ru = 'https://apii.oopss.top/api/friend-apply/reject?token=' + (a.id || '');
    let html = '', sub = '', to = '';
    if (e.type === 'new-application') {
      to = process.env.ADMIN_EMAIL;
      sub = '【友链申请】' + a.name + ' 申请友链';
      html = adminEmail(a, au, ru);
      feishuMsgs.push(buildFeishu(a, au, ru));
    } else if (e.type === 'applicant-issue') {
      to = a.email;
      sub = '【Brandon 友链申请】需要补充信息';
      html = applicantEmail(a, reapplyUrl);
    } else if (e.type === 'approved') {
      to = a.email;
      sub = '【Brandon 友链申请】已通过';
      html = approvedEmail(a);
    } else if (e.type === 'rejected') {
      to = a.email;
      sub = '【Brandon 友链申请】未通过';
      html = rejectedEmail(a);
    }
    if (to && html) {
      await t.sendMail({from: 'liboning2011@vip.qq.com', to, subject: sub, html});
      console.log('Sent to ' + to + ': ' + sub);
    }
  }
  if (feishuMsgs.length) {
    const msg = {
      msg_type: 'interactive',
      card: {
        header: {title: {tag: 'plain_text', content: '📬 友链申请通知'}, template: 'blue'},
        elements: feishuMsgs.flat(),
      },
    };
    fs.writeFileSync('/tmp/feishu_data.json', JSON.stringify(msg));
  }
}

function adminEmail(a, au, ru) {
  let r = '<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;background:#f5f7fa;font-family:sans-serif"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#12affa,#0598df);padding:24px;text-align:center"><div style="color:#fff;font-size:20px;font-weight:700">友链自助申请系统</div><div style="color:rgba(255,255,255,.8);font-size:13px;margin-top:4px">新友链申请</div></td></tr><tr><td style="padding:24px"><div style="font-size:15px;font-weight:600;margin-bottom:16px">' + a.name + ' 申请与您交换友链</div><table style="font-size:14px;line-height:2">';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">博客名称</td><td><strong>' + a.name + '</strong></td></tr>';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">网站地址</td><td><a href="' + a.website + '">' + a.website + '</a></td></tr>';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">简介</td><td>' + (a.description || '&mdash;') + '</td></tr>';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">友链页</td><td><a href="' + a.friendLink + '">' + a.friendLink + '</a></td></tr>';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">RSS</td><td>' + (a.rss || '&mdash;') + '</td></tr>';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">头像</td><td>' + (a.avatar ? '✅' : '❌') + '</td></tr>';
  r += '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">申请人邮箱</td><td>' + a.email + '</td></tr></table>';
  r += '<div style="margin:20px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;font-size:13px;line-height:1.8"><strong>初审结果：</strong><br>友链页检查：' + (a.linkOk ? '✅ 已找到我的友链' : '❌ 未找到') + '<br>头像检查：' + (a.avatarOk ? '✅ 可访问' : '❌ 不可用') + '<br>RSS: ' + (a.rssOk ? '✅ 可访问' : '❌ 不可用或未提供') + '</div>';
  r += '<table width="100%"><tr><td width="50%" style="padding-right:6px"><a href="' + au + '" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">✅ 同意申请</a></td>';
  r += '<td width="50%" style="padding-left:6px"><a href="' + ru + '" style="display:block;text-align:center;padding:14px;background:#f43f5e;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">❌ 拒绝申请</a></td></tr></table>';
  r += '<div style="margin-top:12px;font-size:12px;color:#9ca3af;text-align:center">24 小时内未操作将自动同意</div></td></tr></table></td></tr></table>';
  return r;
}

function applicantEmail(a, reapplyUrl) {
  return '<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;background:#f5f7fa;font-family:sans-serif"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden">'
    + '<tr><td style="background:linear-gradient(135deg,#12affa,#0598df);padding:24px;text-align:center"><div style="color:#fff;font-size:20px;font-weight:700">Brandon 友链自助申请系统</div></td></tr>'
    + '<tr><td style="padding:24px;font-size:15px;line-height:1.8;color:#374151">'
    + '您好！感谢您申请交换友链。<br><br>您的申请已收到，但有以下信息需要补充：'
    + '<div style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-radius:8px;color:#b91c1c;font-size:14px">'
    + '⚠️ 未能在您的友链页找到我的站点链接（blog.oopss.top）<br>'
    + '⚠️ 头像地址无法访问'
    + '</div>'
    + '<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;font-size:13px;color:#6b7280">'
    + '<strong>您的博客：</strong><a href="' + a.website + '" style="color:#12affa">' + a.website + '</a><br>'
    + '<strong>申请地址：</strong><a href="' + SITE + '" style="color:#12affa">' + SITE + '</a>'
    + '</div>'
    + '<a href="' + reapplyUrl + '" style="display:inline-block;margin-top:8px;padding:12px 24px;background:linear-gradient(135deg,#12affa,#0598df);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">📝 重新提交</a>'
    + '<div style="margin-top:16px;font-size:13px;color:#9ca3af">点击上方按钮，已填写的信息会自动带入表单，方便您修改后重新提交。</div>'
    + '</td></tr></table></td></tr></table>';
}

function approvedEmail(a) {
  return '<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;background:#f5f7fa;font-family:sans-serif"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden">'
    + '<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center"><div style="color:#fff;font-size:20px;font-weight:700">友链申请已通过 🎉</div></td></tr>'
    + '<tr><td style="padding:24px;font-size:15px;line-height:1.8;color:#374151">您好！您的友链申请已通过，已将贵站添加至我的友链列表。'
    + '<div style="margin:16px 0;padding:12px;background:#f0fdf4;border-radius:8px;font-size:14px;color:#166534"><strong>我的站点信息：</strong><br>Brandon&#39;s Blog：<a href="' + SITE + '" style="color:#10b981">' + SITE + '</a></div>'
    + '请检查您那边是否已添加我的友链，感谢支持！</td></tr></table></td></tr></table>';
}

function rejectedEmail(a) {
  return '<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;background:#f5f7fa;font-family:sans-serif"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden">'
    + '<tr><td style="background:linear-gradient(135deg,#f43f5e,#e11d48);padding:24px;text-align:center"><div style="color:#fff;font-size:20px;font-weight:700">友链申请未通过</div></td></tr>'
    + '<tr><td style="padding:24px;font-size:15px;line-height:1.8;color:#374151">您好！很遗憾，您的友链申请暂未通过。可能是信息不完整或存在异常，欢迎补充信息后重新申请。</td></tr></table></td></tr></table>';
}

function buildFeishu(a, au, ru) {
  return [
    {tag: 'markdown', content: '**' + a.name + '** 申请交换友链\n网站：' + a.website + '\n邮箱：' + a.email + '\n简介：' + (a.description || '无')},
    {tag: 'markdown', content: '初审结果：友链页 ' + (a.linkOk ? '✅' : '❌') + ' | 头像 ' + (a.avatarOk ? '✅' : '❌') + ' | RSS ' + (a.rssOk ? '✅' : '❌')},
    {tag: 'action', actions: [
      {tag: 'button', text: {tag: 'plain_text', content: '✅ 同意'}, url: au, type: 'primary'},
      {tag: 'button', text: {tag: 'plain_text', content: '❌ 拒绝'}, url: ru, type: 'danger'},
    ]},
  ];
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});