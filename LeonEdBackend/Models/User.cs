using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class User
    {
        public Guid Id { get; set; }

        public Guid? SchoolId { get; set; }

        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public UserRole Role { get; set; }

        public bool IsActive { get; set; } = true;

        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiry { get; set; }

        public DateTime? LastLogin { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public School? School { get; set; }
    }
}