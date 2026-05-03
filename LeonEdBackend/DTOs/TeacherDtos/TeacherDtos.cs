using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.DTOs.TeacherDtos
{
    public class CreateTeacherRequest
    {
        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Phone { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateTeacherRequest
    {
        [MaxLength(200)]
        public string? FullName { get; set; }

        [MaxLength(30)]
        public string? Phone { get; set; }
    }

    public class AssignTeacherRequest
    {
        [Required]
        public Guid SubjectId { get; set; }

        [Required]
        public Guid ClassId { get; set; }
    }

    public class TeacherResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TeacherAssignmentResponse> Assignments { get; set; } = new();
    }

    public class TeacherAssignmentResponse
    {
        public Guid Id { get; set; }
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
    }
}
