using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.DTOs.SchoolDtos
{
    public class CreateSchoolRequest
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string ContactEmail { get; set; } = string.Empty;

        [MaxLength(30)]
        public string ContactPhone { get; set; } = string.Empty;

        [MaxLength(500)]
        public string LogoUrl { get; set; } = string.Empty;

        public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;
    }

    public class UpdateSchoolRequest
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        [EmailAddress]
        public string? ContactEmail { get; set; }

        [MaxLength(30)]
        public string? ContactPhone { get; set; }

        [MaxLength(500)]
        public string? LogoUrl { get; set; }
    }

    public class UpdateSchoolPlanRequest
    {
        [Required]
        public SubscriptionPlan SubscriptionPlan { get; set; }
    }

    public class SchoolResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string SubscriptionPlan { get; set; } = string.Empty;
        public string SubscriptionStatus { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int MaxTeachers { get; set; }
        public int MaxStudents { get; set; }
        public int CurrentTeacherCount { get; set; }
        public int CurrentStudentCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SubscriptionPlanInfo
    {
        public string Name { get; set; } = string.Empty;
        public int MaxTeachers { get; set; }
        public int MaxStudents { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
