using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.DTOs.ClassDtos
{
    public class CreateClassRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(10)]
        public string Arm { get; set; } = string.Empty;

        public Guid? AcademicSessionId { get; set; }
    }

    public class UpdateClassRequest
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(10)]
        public string? Arm { get; set; }
    }

    public class AssignSubjectsToClassRequest
    {
        [Required]
        public List<Guid> SubjectIds { get; set; } = new();
    }

    public class ClassResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Arm { get; set; } = string.Empty;
        public int StudentCount { get; set; }
        public Guid? AcademicSessionId { get; set; }
        public string? AcademicSessionName { get; set; }
        public List<ClassSubjectResponse> Subjects { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class ClassSubjectResponse
    {
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
    }
}
