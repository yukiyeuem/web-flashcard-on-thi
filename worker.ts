/**
 * Cloudflare Worker with Static Assets & API Routes
 * Handles Resend OTP delivery, Cloudflare D1 database bindings, and static assets
 */

interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  DB?: any;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ADMIN_EMAIL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Route: /api/auth/otp/request
    if (url.pathname === '/api/auth/otp/request' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        const purpose = body.purpose || 'LOGIN';

        if (!email) {
          return new Response(JSON.stringify({ error: 'Email không được để trống.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const code = (body.code || '').trim() || Math.floor(100000 + Math.random() * 900000).toString();
        const now = Date.now();
        const expiresAt = now + 10 * 60 * 1000; // 10 phút

        // Lưu vào Cloudflare D1 nếu có binding DB
        if (env.DB) {
          try {
            // Hủy các mã OTP cũ chưa dùng của email này để tránh xung đột
            await env.DB.prepare(
              `UPDATE otp_codes SET consumed_at = ? WHERE email = ? AND purpose = ? AND consumed_at IS NULL`
            )
            .bind(now, email, purpose)
            .run();

            await env.DB.prepare(
              `INSERT INTO otp_codes (id, email, code, purpose, expires_at, consumed_at, attempts)
               VALUES (?, ?, ?, ?, ?, NULL, 0)`
            )
            .bind(`otp-${now}`, email, code, purpose, expiresAt)
            .run();
          } catch (dbErr) {
            console.warn('D1 OTP insert error:', dbErr);
          }
        }

        // Gửi qua Resend API
        let emailSent = false;
        let resendError: any = null;
        const apiKey = (body.resendApiKey || env.RESEND_API_KEY || '').trim();

        if (apiKey) {
          try {
            const fromEmail = (env.RESEND_FROM_EMAIL || '').trim() || 'CertFlash <onboarding@resend.dev>';
            const subject = purpose === 'LOGIN'
              ? `[CertFlash] Mã OTP đăng nhập của bạn: ${code}`
              : `[CertFlash] Mã xác minh tài khoản của bạn: ${code}`;

            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [email],
                subject,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0f172a; color: #f8fafc; border-radius: 18px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <h1 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: 800;">CertFlash</h1>
                      <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Nền tảng Ôn Thi Chứng Chỉ Quốc Tế</p>
                    </div>
                    <div style="background: #1e293b; border-radius: 14px; padding: 24px; text-align: center; border: 1px solid #475569;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #cbd5e1;">
                        ${purpose === 'LOGIN' ? 'Mã OTP đăng nhập an toàn của bạn:' : 'Mã xác minh địa chỉ Gmail của bạn:'}
                      </p>
                      <div style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; background: #0f172a; padding: 14px 20px; border-radius: 12px; display: inline-block; border: 1px dashed #38bdf8;">
                        ${code}
                      </div>
                      <p style="margin: 14px 0 0 0; font-size: 12px; color: #94a3b8;">
                        Mã xác thực có hiệu lực trong <strong>10 phút</strong>. Tuyệt đối không chia sẻ mã này cho người khác.
                      </p>
                    </div>
                    <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px;">
                      Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
                    </p>
                  </div>
                `
              })
            });

            if (res.ok) {
              emailSent = true;
            } else {
              resendError = await res.json();
            }
          } catch (e: any) {
            resendError = e.message;
          }
        } else {
          resendError = 'Biến môi trường RESEND_API_KEY chưa có trên server.';
        }

        return new Response(
          JSON.stringify({
            success: true,
            email,
            emailSent,
            errorDetail: !emailSent && resendError ? (typeof resendError === 'object' ? JSON.stringify(resendError) : resendError) : null,
            message: emailSent
              ? `Mã OTP đã được gửi thành công đến ${email} qua Resend.`
              : `Chưa gửi được mail qua Resend. Vui lòng kiểm tra lại Resend API Key.`
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Lỗi xử lý yêu cầu OTP' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. Route: /api/auth/otp/verify
    if (url.pathname === '/api/auth/otp/verify' && request.method === 'POST') {
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

          await env.DB.prepare(`UPDATE otp_codes SET consumed_at = ? WHERE id = ?`)
            .bind(now, record.id)
            .run();
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
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Lỗi xác thực' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Phục vụ giao diện tĩnh từ thư mục dist (Vite build)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
