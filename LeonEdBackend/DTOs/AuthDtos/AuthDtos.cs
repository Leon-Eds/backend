using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.DTOs.AuthDtos
{
    public class LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterSchoolRequest
    {
        [Required, MaxLength(200)]
        public string SchoolName { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string AdminName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;
    }

    public class CreateSuperAdminRequest
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string SecretKey { get; set; } = string.Empty;
    }

    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime TokenExpiry { get; set; }
        public UserInfo User { get; set; } = null!;
    }

    public class UserInfo
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid? SchoolId { get; set; }
        public string? SchoolName { get; set; }
    }
}
