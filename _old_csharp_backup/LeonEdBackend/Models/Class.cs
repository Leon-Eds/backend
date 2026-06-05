using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.Models
{
    public class Class
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Guid? AcademicSessionId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(10)]
        public string Arm { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public School School { get; set; } = null!;
        public AcademicSession? AcademicSession { get; set; }
        public ICollection<Student> Students { get; set; } = new List<Student>();
        public ICollection<ClassSubject> ClassSubjects { get; set; } = new List<ClassSubject>();
        public ICollection<TeacherSubjectAssignment> TeacherAssignments { get; set; } = new List<TeacherSubjectAssignment>();
    }
}