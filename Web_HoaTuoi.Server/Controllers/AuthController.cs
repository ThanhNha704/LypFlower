using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Web_HoaTuoi.Server.DTOs;
using Web_HoaTuoi.Server.Models;
using Web_HoaTuoi.Server.Services;

namespace Web_HoaTuoi.Server.Controllers;

/// <summary>
/// POST /api/auth/register  — Đăng ký tài khoản Customer
/// POST /api/auth/login     — Đăng nhập, trả về JWT
/// GET  /api/auth/me        — Lấy thông tin user hiện tại
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;
    private readonly IEmailSenderService _emailSender;

    public AuthController(UserManager<AppUser> userManager, IConfiguration config, ILogger<AuthController> logger, IEmailSenderService emailSender)
    {
        _userManager = userManager;
        _config = config;
        _logger = logger;
        _emailSender = emailSender;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        try
        {
            if (await _userManager.FindByEmailAsync(req.Email) is not null)
                return BadRequest(new { message = "Email đã được sử dụng." });

            var user = new AppUser
            {
                UserName       = req.Email,
                Email          = req.Email,
                FullName       = req.FullName,
                Phone          = req.Phone,
                DefaultAddress = req.Address,
                EmailConfirmed = true,
                CreatedAt      = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            await _userManager.AddToRoleAsync(user, "Customer");

            _logger.LogInformation("[Auth] Đăng ký thành công: {Email}", req.Email);
            return Ok(BuildAuthResponse(user, "Customer"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Auth] Lỗi khi đăng ký: {Email}", req.Email);
            return StatusCode(500, new { message = "Lỗi server khi đăng ký. Vui lòng thử lại." });
        }
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user is null || !await _userManager.CheckPasswordAsync(user, req.Password))
                return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

            var roles = await _userManager.GetRolesAsync(user);
            var role  = roles.Contains("Admin") ? "Admin" : roles.Contains("Staff") ? "Staff" : "Customer";

            _logger.LogInformation("[Auth] Login thành công: {Email}, Role={Role}", req.Email, role);
            return Ok(BuildAuthResponse(user, role));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Auth] Lỗi khi login: {Email}", req.Email);
            return StatusCode(500, new { message = "Lỗi server khi đăng nhập. Vui lòng thử lại." });
        }
    }

    // POST /api/auth/google
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleLoginRequest req)
    {
        // 1. Verify Google id_token
        Google.Apis.Auth.GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _config["Authentication:Google:ClientId"] }
            };
            payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(req.IdToken, settings);
        }
        catch (Exception)
        {
            return Unauthorized(new { message = "Token Google không hợp lệ." });
        }

        // 2. Tìm hoặc tạo user
        var email = payload.Email;
        var user = await _userManager.FindByEmailAsync(email);
        bool isNewUser = false;

        if (user is null)
        {
            isNewUser = true;
            user = new AppUser
            {
                UserName       = email,
                Email          = email,
                FullName       = payload.Name ?? email.Split('@')[0],
                AvatarUrl      = payload.Picture,
                EmailConfirmed = true,
                CreatedAt      = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            await _userManager.AddToRoleAsync(user, "Customer");
        }

        // 3. Sinh JWT nội bộ (dùng lại logic hiện có)
        var roles = await _userManager.GetRolesAsync(user);
        var role  = roles.Contains("Admin") ? "Admin" : roles.Contains("Staff") ? "Staff" : "Customer";

        return Ok(BuildAuthResponse(user, role, isNewUser));
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
   var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      var user   = await _userManager.FindByIdAsync(userId!);
        if (user is null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var role  = roles.Contains("Admin") ? "Admin" : roles.Contains("Staff") ? "Staff" : "Customer";

        return Ok(BuildAuthResponse(user, role));
    }

    // PUT /api/auth/profile
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user is null) return Unauthorized();

        user.FullName = req.FullName;
        user.Phone = req.Phone;
        user.DefaultAddress = req.Address;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.Contains("Admin") ? "Admin" : "Customer";
        
        return Ok(BuildAuthResponse(user, role));
    }

    // PUT /api/auth/change-password
    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user is null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        return Ok(new { message = "Đổi mật khẩu thành công!" });
    }

    // POST /api/auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
        {
            return Ok(new { message = "Nếu email tồn tại, một mã OTP đặt lại mật khẩu đã được gửi." });
        }

        // Sinh mã OTP 6 số (dùng EmailTokenProvider) thay vì mã dài
        var otpCode = await _userManager.GenerateUserTokenAsync(user, TokenOptions.DefaultEmailProvider, "ResetPassword");
        
        var emailBody = $@"
            <h3>Mã xác nhận đặt lại mật khẩu</h3>
            <p>Xin chào {user.FullName},</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhập mã OTP gồm 6 chữ số dưới đây vào trang web để tiếp tục:</p>
            <h2 style='color: #d81b60; font-size: 24px; padding: 10px; border: 1px solid #d81b60; display: inline-block; border-radius: 5px;'>{otpCode}</h2>
            <p>Mã này có hiệu lực trong thời gian ngắn. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        ";

        await _emailSender.SendEmailAsync(req.Email, "Mã OTP lấy lại mật khẩu - Web Hoa Tươi", emailBody);

        return Ok(new { message = "Nếu email tồn tại, một mã OTP đặt lại mật khẩu đã được gửi." });
    }

    // POST /api/auth/verify-reset-otp
    [HttpPost("verify-reset-otp")]
    public async Task<IActionResult> VerifyResetOtp([FromBody] VerifyOtpRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            return BadRequest(new { message = "Email hoặc mã OTP không hợp lệ." });

        var isValid = await _userManager.VerifyUserTokenAsync(user, TokenOptions.DefaultEmailProvider, "ResetPassword", req.OtpCode);
        if (!isValid)
        {
            return BadRequest(new { message = "Mã OTP không hợp lệ hoặc đã hết hạn." });
        }

        // Nếu mã OTP đúng, sinh ra mã Token Reset Password chính thức (mã dài) để client dùng đổi pass luôn
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

        return Ok(new { message = "Xác nhận thành công", resetToken });
    }

    // POST /api/auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            return BadRequest(new { message = "Yêu cầu không hợp lệ." });

        var result = await _userManager.ResetPasswordAsync(user, req.Token, req.NewPassword);
        if (result.Succeeded)
        {
            return Ok(new { message = "Đặt lại mật khẩu thành công!" });
        }

        return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
    }

    // ── Private helpers ──────────────────────────────────────
    private AuthResponse BuildAuthResponse(AppUser user, string role, bool isNewUser = false)
    {
        var token = GenerateJwt(user, role);
        return new AuthResponse(token, user.Id, user.FullName, user.Email!, role, user.Phone, user.DefaultAddress, isNewUser);
    }

    private string GenerateJwt(AppUser user, string role)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
     var expires = DateTime.UtcNow.AddDays(int.Parse(_config["Jwt:ExpireDays"] ?? "7"));

    var claims = new[]
        {
     new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
   new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Role, role),
     new Claim("fullName", user.FullName),
        };

        var token = new JwtSecurityToken(
 issuer:   _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
            claims:   claims,
            expires:  expires,
  signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
