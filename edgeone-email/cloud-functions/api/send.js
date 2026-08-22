// Brandon's Blog 邮件发送服务（EdgeOne Makers Cloud Function）
// POST /api/send  { emails: [{ type, app }] }
// 入参结构与原 GitHub Actions 的 client_payload.emails 一致。
// 鉴权：Authorization: Bearer <MAIL_API_TOKEN>（context.env.MAIL_API_TOKEN）
import nodemailer from 'nodemailer';

const SITE = 'https://blog.oopss.top';
const APPLY_URL = SITE + '/friends/apply';
const SMTP_HOST = 'smtp.qq.com';

export async function onRequestPost(context) {
  const env = context.env || {};
  // 鉴权
  const auth = context.request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!env.MAIL_API_TOKEN || token !== env.MAIL_API_TOKEN) {
    return jsonRes({ok: false, error: '鉴权失败'}, 401);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonRes({ok: false, error: '请提供 JSON 请求体'}, 400);
  }

  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    return jsonRes({ok: false, error: '缺少 SMTP 配置'}, 500);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: 465,
    secure: true,
    auth: {user: env.SMTP_USER, pass: env.SMTP_PASSWORD},
  });

  const feishuMsgs = [];
  const results = [];

  for (const e of (body.emails || [])) {
    const a = e.app || {};
    const reapplyUrl = APPLY_URL + '?' + buildApplyParams(a);
    const au = 'https://apii.oopss.top/api/friend-apply/approve?token=' + (a.id || '');
    const ru = 'https://apii.oopss.top/api/friend-apply/reject?token=' + (a.id || '');
    let html = '', sub = '', to = '', from = env.MAIL_FROM || 'liboning2011@vip.qq.com';

    if (e.type === 'new-application') {
      to = env.ADMIN_EMAIL || '';
      sub = '【友链申请】' + a.name + ' 申请交换友链';
      html = adminEmail(a, au, ru);
      feishuMsgs.push(buildFeishu(a, au, ru));
    } else if (e.type === 'thankyou') {
      to = a.email;
      sub = '【Brandon 友链申请】已收到您的申请';
      html = thankyouEmail(a);
    } else if (e.type === 'approved') {
      to = a.email;
      sub = '【Brandon 友链申请】已通过 🎉';
      html = approvedEmail(a);
    } else if (e.type === 'manage-url') {
      to = a.email;
      sub = '【Brandon 友链】友链管理后台';
      html = manageUrlEmail(a);
    } else if (e.type === 'rejected') {
      to = a.email;
      sub = '【Brandon 友链申请】未通过';
      html = rejectedEmail(a, reapplyUrl);
    } else {
      results.push({type: e.type, ok: false, error: '未知邮件类型'});
      continue;
    }

    if (!to || !html) {
      results.push({type: e.type, ok: false, error: '缺少收件人或内容'});
      continue;
    }

    try {
      await transporter.sendMail({from: `"Brandon's Blog" <${from}>`, to, subject: sub, html});
      results.push({type: e.type, to, subject: sub, ok: true});
    } catch (err) {
      results.push({type: e.type, to, subject: sub, ok: false, error: err.message});
    }
  }

  // 飞书通知（仅 new-application）
  if (feishuMsgs.length && env.FEISHU_URL) {
    try {
      const msg = {
        msg_type: 'interactive',
        card: {
          header: {title: {tag: 'plain_text', content: '📬 友链申请通知'}, template: 'blue'},
          elements: feishuMsgs.flat(),
        },
      };
      await fetch(env.FEISHU_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(msg),
      });
    } catch {}
  }

  const okCount = results.filter((r) => r.ok).length;
  return jsonRes({ok: okCount === results.length, total: results.length, okCount, results});
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'},
  });
}

function buildApplyParams(a) {
  const params = new URLSearchParams({
    id: a.id || '',
    name: a.name || '', website: a.website || '', friendLink: a.friendLink || '',
    rss: a.rss || '', email: a.email || '', description: a.description || '',
    avatarUrl: a.avatar || '',
  });
  return params.toString();
}

function shell(headColor, headTitle, subTitle, body, foot) {
  return '<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;background:#f5f7fa;font-family:-apple-system,\'PingFang SC\',sans-serif"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">'
    + '<tr><td style="background:linear-gradient(135deg,' + headColor + ');padding:24px;text-align:center"><div style="color:#fff;font-size:20px;font-weight:700">' + headTitle + '</div>'
    + (subTitle ? '<div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:4px">' + subTitle + '</div>' : '')
    + '</td></tr>'
    + '<tr><td style="padding:24px;font-size:15px;line-height:1.8;color:#374151">' + body + '</td></tr>'
    + (foot ? '<tr><td style="padding:0 24px 24px">' + foot + '</td></tr>' : '')
    + '</table></td></tr></table>';
}

function adminEmail(a, au, ru) {
  if (a._adminCustom) {
    const customFoot = a._approveUrl
      ? '<a href="' + a._approveUrl + '" style="display:inline-block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">✅ 同意变更</a>'
      : '';
    const body = '<div style="font-size:14px;color:#374151;line-height:2">' + a._adminCustom + '</div>';
    return shell('#f59e0b,#d97706', '友链 URL 变更审批', '需要您确认', body, customFoot ? '<div style="text-align:center">' + customFoot + '</div>' : '');
  }
  const body =
    '<div style="font-size:15px;font-weight:600;margin-bottom:16px">' + a.name + ' 申请与您交换友链</div>'
    + '<table style="font-size:14px;line-height:2">'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">博客名称</td><td><strong>' + a.name + '</strong></td></tr>'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">网站地址</td><td><a href="' + a.website + '" style="color:#12affa">' + a.website + '</a></td></tr>'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">简介</td><td>' + (a.description || '&mdash;') + '</td></tr>'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">友链页</td><td><a href="' + a.friendLink + '" style="color:#12affa">' + a.friendLink + '</a></td></tr>'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">RSS</td><td>' + (a.rss || '&mdash;') + '</td></tr>'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">头像</td><td>' + (a.avatar ? '✅' : '❌') + '</td></tr>'
    + '<tr><td style="color:#6b7280;padding-right:12px;white-space:nowrap">申请人邮箱</td><td>' + a.email + '</td></tr>'
    + '</table>'
    + '<div style="margin:20px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;font-size:13px;line-height:1.8"><strong>初审结果：</strong><br>友链页检查：' + (a.linkOk ? '✅ 已找到我的友链' : '❌ 未找到') + '<br>头像检查：' + (a.avatarOk ? '✅ 可访问' : '❌ 不可用') + '<br>RSS: ' + (a.rssOk ? '✅ 可访问' : '❌ 不可用或未提供') + '</div>';
  const foot =
    '<table width="100%"><tr>'
    + '<td width="50%" style="padding-right:6px"><a href="' + au + '" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">✅ 同意</a></td>'
    + '<td width="50%" style="padding-left:6px"><a href="' + ru + '" style="display:block;text-align:center;padding:14px;background:#f43f5e;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">❌ 拒绝</a></td>'
    + '</tr></table>'
    + '<div style="margin-top:12px;font-size:12px;color:#9ca3af;text-align:center">超 24 小时未操作将自动通过，超过 48 小时视为异常由人工处理</div>';
  return shell('#12affa,#0598df', '友链自助申请系统', '新友链申请', body, foot);
}

function thankyouEmail(a) {
  const body =
    '您好，' + (a.name || '') + '：<br><br>'
    + '我们已收到您的友链申请，感谢您的支持与信任！<br><br>'
    + '您的申请正在排队等待审批，请<b>耐心等候</b>。审批结果会第一时间通过邮件通知您，通常会在 <b>24~48 小时</b> 内完成。<br><br>'
    + '<div style="margin:16px 0;padding:12px 16px;background:#f0f7ff;border-radius:8px;font-size:13px;color:#666">'
    + '<strong>申请内容：</strong><br>'
    + '博客名称：' + a.name + '<br>'
    + '网站地址：' + (a.website || '&mdash;') + '<br>'
    + '简介：' + (a.description || '&mdash;') + '<br>'
    + 'RSS：' + (a.rss || '未提供')
    + '</div>';
  return shell('#12affa,#0598df', '感谢您的友链申请', '已收到，请耐心等待审批', body);
}

function approvedEmail(a) {
  const manageUrl = a._manageKey && a._manageId
    ? SITE + '/friends/manage?id=' + encodeURIComponent(a._manageId) + '&key=' + encodeURIComponent(a._manageKey)
    : '';
  const manageHtml = manageUrl
    ? '<div style="margin:16px 0;padding:12px;background:#f0fdf4;border-radius:8px;font-size:14px;color:#166534"><strong>🔑 友链管理面板：</strong><br>您可随时修改自己的友链信息（名称、头像、简介、RSS）<br><a href="' + manageUrl + '" style="color:#10b981;word-break:break-all">' + manageUrl + '</a></div>'
    : '';
  const body =
    '您好，' + (a.name || '') + '：<br><br>恭喜！您的友链申请已<b>通过</b>，我们已将该站点添加至友链列表。'
    + '<div style="margin:16px 0;padding:12px;background:#f0fdf4;border-radius:8px;font-size:14px;color:#166534"><strong>我的站点信息：</strong><br>Brandon&#39;s Blog：<a href="' + SITE + '" style="color:#10b981">' + SITE + '</a></div>'
    + manageHtml
    + '请检查您那边是否已添加我的友链，感谢支持！';
  return shell('#10b981,#059669', '友链申请已通过 🎉', '', body);
}

function manageUrlEmail(a) {
  const manageUrl = (a._manageKey && a._manageId)
    ? SITE + '/friends/manage?id=' + encodeURIComponent(a._manageId) + '&key=' + encodeURIComponent(a._manageKey)
    : '';
  const body =
    '您好，' + (a.name || '') + '：<br><br>'
    + '您的好友链已生效，本站已添加贵站至友链列表 ✅'
    + '<div style="margin:16px 0;padding:12px 16px;background:#f0f7ff;border-radius:8px;font-size:13px;color:#444;line-height:1.9">'
    + '<strong>🔑 友链管理后台：</strong><br>'
    + '您可随时修改自己的友链信息：名称、头像、简介、RSS、网站地址。<br>'
    + (manageUrl
        ? '<a href="' + manageUrl + '" style="color:#12affa;word-break:break-all">' + manageUrl + '</a>'
        : '链接暂不可用，请联系站长。')
    + '</div>'
    + '请妥善保管此链接（含专属密钥），仅用于管理您自己的友链信息。';
  return shell('#12affa,#0598df', '友链管理后台', '您的友链信息可在此自助维护', body);
}

function rejectedEmail(a, reapplyUrl) {
  const body =
    '您好，' + (a.name || '') + '：<br><br>很遗憾，我方暂时未能通过您的友链申请。可能的原因：<br>'
    + '<div style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-radius:8px;color:#b91c1c;font-size:14px;line-height:1.9">'
    + '• 网站不符合本博客的友链规则；<br>'
    + '• 或申请信息填写有误。'
    + '</div>'
    + '若网站暂不符合规则，欢迎待网站完善后再来申请。若是信息有误，可点击下方按钮<b>修改申请并重新提交</b>。';
  const foot =
    '<a href="' + reapplyUrl + '" style="display:inline-block;text-align:center;padding:12px 24px;background:linear-gradient(135deg,#12affa,#0598df);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600">📝 修改申请并重新提交</a>'
    + '<div style="margin-top:12px;font-size:12px;color:#9ca3af">点击上方按钮，你之前填写的信息和申请编号会自动带入表单，修改后提交即可。</div>';
  return shell('#f43f5e,#e11d48', '友链申请未通过', '', body, foot);
}

function buildFeishu(a, au, ru) {
  return [
    {tag: 'markdown', content: '**' + a.name + '** 申请交换友链\n网站：' + a.website + '\n邮箱：' + a.email + '\n简介：' + (a.description || '无')},
    {tag: 'markdown', content: '初审：友链页 ' + (a.linkOk ? '✅' : '❌') + ' | 头像 ' + (a.avatarOk ? '✅' : '❌') + ' | RSS ' + (a.rssOk ? '✅' : '❌')},
    {tag: 'action', actions: [
      {tag: 'button', text: {tag: 'plain_text', content: '✅ 同意'}, url: au, type: 'primary'},
      {tag: 'button', text: {tag: 'plain_text', content: '❌ 拒绝'}, url: ru, type: 'danger'},
    ]},
  ];
}

export function onRequestGet() {
  return jsonRes({ok: true, message: 'EdgeOne 邮件发送服务，请使用 POST /api/send'});
}