using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.DTOs.StudentDtos
{
    public class CreateStudentRequest
    {
        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? AdmissionNumber { get; set; }

        [Required]
        public Gender Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public Guid? ClassId { get; set; }

        [MaxLength(200)]
        public string ParentName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string ParentPhone { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ParentEmail { get; set; } = string.Empty;
    }

    public class UpdateStudentRequest
    {
        [MaxLength(200)]
        public string? FullName { get; set; }

        public Gender? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public Guid? ClassId { get; set; }

        [MaxLength(200)]
        public string? ParentName { get; set; }

        [MaxLength(30)]
        public string? ParentPhone { get; set; }

        [MaxLength(200)]
        public string? ParentEmail { get; set; }

        public StudentStatus? Status { get; set; }
    }

    public class StudentResponse
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string ParentPhone { get; set; } = string.Empty;
        public string ParentEmail { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public Guid? ClassId { get; set; }
        public string? ClassName { get; set; }
        public DateTime EnrolledAt { get; set; }
        public string? SystemEmail { get; set; } // Added to show the generated login email
    }
}
