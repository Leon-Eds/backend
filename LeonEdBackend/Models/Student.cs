using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class Student
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Guid? UserId { get; set; }

        public Guid? ClassId { get; set; }

        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string AdmissionNumber { get; set; } = string.Empty;

        public Gender Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(200)]
        public string ParentName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string ParentPhone { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ParentEmail { get; set; } = string.Empty;

        public StudentStatus Status { get; set; } = StudentStatus.Active;

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public School School { get; set; } = null!;
        public User? User { get; set; }
        public Class? Class { get; set; }
    }
}