using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.AuthDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<ApiResponse<AuthResponse>> CreateSuperAdmin(CreateSuperAdminRequest request)
        {
            var configuredSecret = _configuration["SuperAdminSecret"];
            if (string.IsNullOrEmpty(configuredSecret) || request.SecretKey != configuredSecret)
            {
                return ApiResponse<AuthResponse>.FailResponse("Invalid secret key.");
            }

            var existingSuperAdmin = await _context.Users
                .AnyAsync(u => u.Role == UserRole.SuperAdmin);

            // if (existingSuperAdmin)
            // {
            //     return ApiResponse<AuthResponse>.FailResponse("A Super Admin already exists.");
            // }

            var existingEmail = await _context.Users.AnyAsync(u => u.Email == request.Email.ToLower());
            if (existingEmail)
            {
                return ApiResponse<AuthResponse>.FailResponse("Email already in use.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = UserRole.SuperAdmin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var authResponse = GenerateAuthResponse(user, null);
            return ApiResponse<AuthResponse>.SuccessResponse(authResponse, "Super Admin created successfully.");
        }

        public async Task<ApiResponse<AuthResponse>> RegisterSchool(RegisterSchoolRequest request)
        {
            // Check if email already exists
            var existingEmail = await _context.Users.AnyAsync(u => u.Email == request.Email.ToLower());
            if (existingEmail)
            {
                return ApiResponse<AuthResponse>.FailResponse("Email already in use.");
            }

            // Generate a unique slug
            var slug = GenerateSlug(request.SchoolName);
            var slugExists = await _context.Schools.AnyAsync(s => s.Slug == slug);
            if (slugExists)
            {
                slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";
            }

            // Create school
            var school = new School
            {
                Id = Guid.NewGuid(),
                Name = request.SchoolName,
                Address = request.Address,
                ContactEmail = request.Email.ToLower(),
                ContactPhone = request.Phone,
                Slug = slug,
                SubscriptionPlan = request.SubscriptionPlan,
                SubscriptionStatus = SubscriptionStatus.Active,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Create school admin user
            var user = new User
            {
                Id = Guid.NewGuid(),
                SchoolId = school.Id,
                Name = request.AdminName,
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = UserRole.SchoolAdmin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Schools.Add(school);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var authResponse = GenerateAuthResponse(user, school);
            return ApiResponse<AuthResponse>.SuccessResponse(authResponse, "School registered successfully.");
        }

        public async Task<ApiResponse<AuthResponse>> Login(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.School)
                .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return ApiResponse<AuthResponse>.FailResponse("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                return ApiResponse<AuthResponse>.FailResponse("Your account has been deactivated. Contact your administrator.");
            }

            // Check school status for non-super-admin users
            if (user.Role != UserRole.SuperAdmin && user.School != null)
            {
                if (!user.School.IsActive)
                {
                    return ApiResponse<AuthResponse>.FailResponse("Your school account has been suspended. Contact LeonEd Africa support.");
                }
            }

            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var authResponse = GenerateAuthResponse(user, user.School);
            return ApiResponse<AuthResponse>.SuccessResponse(authResponse, "Login successful.");
        }

        public async Task<ApiResponse<AuthResponse>> RefreshToken(RefreshTokenRequest request)
        {
            var user = await _context.Users
                .Include(u => u.School)
                .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                return ApiResponse<AuthResponse>.FailResponse("Invalid or expired refresh token.");
            }

            var authResponse = GenerateAuthResponse(user, user.School);
            return ApiResponse<AuthResponse>.SuccessResponse(authResponse);
        }

        public async Task<ApiResponse<bool>> ChangePassword(Guid userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.FailResponse("User not found.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return ApiResponse<bool>.FailResponse("Current password is incorrect.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Password changed successfully.");
        }

        private AuthResponse GenerateAuthResponse(User user, School? school)
        {
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            _context.SaveChanges();

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                TokenExpiry = DateTime.UtcNow.AddMinutes(
                    double.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60")),
                User = new UserInfo
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role.ToString(),
                    SchoolId = user.SchoolId,
                    SchoolName = school?.Name
                }
            };
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Role, user.Role.ToString()),
            };

            if (user.SchoolId.HasValue)
            {
                claims.Add(new Claim("SchoolId", user.SchoolId.Value.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    double.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60")),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        private static string GenerateSlug(string name)
        {
            var slug = name.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');
            return slug;
        }
    }
}
