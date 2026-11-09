/**
 * Cloudflare Pages Function: /api/auth/otp/verify
 * Xác thực mã OTP và đăng nhập
 */

interface Env {
  DB?: any;
  ADMIN_EMAIL?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();
    const purpose = body.purpose || 'LOGIN';

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email và mã OTP là bắt buộc.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = Date.now();
    let isValid = false;

    if (env.DB) {
      const record = await env.DB.prepare(
        `SELECT * FROM otp_codes 
         WHERE email = ? AND code = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?
         ORDER BY expires_at DESC LIMIT 1`
      )
      .bind(email, code, purpose, now)
      .first();

      if (!record) {
        return new Response(JSON.stringify({ error: 'Mã OTP không đúng hoặc đã hết hạn.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Đánh dấu đã sử dụng
      await env.DB.prepare(`UPDATE otp_codes SET consumed_at = ? WHERE id = ?`)
        .bind(now, record.id)
        .run();

      isValid = true;
    } else {
      // Khi chạy không có DB binding, chấp nhận mã hợp lệ
      isValid = true;
    }

    const adminEmail = (env.ADMIN_EMAIL || 'huyhoangpham387@gmail.com').toLowerCase();
    const isAdmin = email === adminEmail;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          email,
          role: isAdmin ? 'ADMIN' : 'USER',
          status: 'ACTIVE'
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Lỗi xác thực' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
