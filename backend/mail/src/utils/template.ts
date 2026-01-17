const provideHTML = (otp: string): string => {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset=UTF-8 />
<meta name=viewport content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Segoe UI,Tahoma,Arial,sans-serif">
<table width=100% cellpadding=0 cellspacing=0>
<tr>
<td align=center style="padding:40px 10px">
<table width=600 cellpadding=0 cellspacing=0 style="background:#111827;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6)">
<tr>
<td align=center style=padding:40px;background:linear-gradient(145deg,#1e293b,#020617)>
<img src=https://res.cloudinary.com/ddmdr4awo/image/upload/v1768618230/logo_mfe0ej.png alt=Kove width=125 style=display:block;margin-bottom:10px;border-radius:33px;color:white />
<h1 style=margin:0;color:#e5e7eb;font-size:50px;letter-spacing:1px>
OTP Verification
</h1>
<p style=margin-top:10px;color:#9ca3af;font-size:20px>
Secure access powered by Kove
</p>
</td>
</tr>
<tr>
<td align=center style="padding:45px 30px;background:#020617">
<p style=color:#cbd5f5;font-size:16px;margin-bottom:15px>
Use the OTP below to continue
</p>
<div style="display:inline-block;padding:18px 36px;font-size:55px;font-weight:700;letter-spacing:10px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#facc15);color:#020617;box-shadow:0 20px 35px rgba(59,130,246,0.4)">
${otp}
</div>
<p style=margin-top:25px;color:#94a3b8;font-size:15px>
This code expires in <strong>5 minutes</strong>
</p>
</td>
</tr>
<tr>
<td style="height:1px;background:linear-gradient(to right,transparent,#334155,transparent)"></td>
</tr>
<tr>
<td align=center style=padding:25px;background:#020617>
<p style=margin:0;color:#64748b;font-size:16px;line-height:1.6>
If you didn.t request this OTP, please ignore this email.<br>
© ${new Date().getFullYear()}<strong> Kove</strong>. All rights reserved.
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};

export default provideHTML;
