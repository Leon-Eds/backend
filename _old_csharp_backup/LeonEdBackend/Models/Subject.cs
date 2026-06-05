using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.Models
{
    public class Subject
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public School School { get; set; } = null!;
        public ICollection<ClassSubject> ClassSubjects { get; set; } = new List<ClassSubject>();
        public ICollection<TeacherSubjectAssignment> TeacherAssignments { get; set; } = new List<TeacherSubjectAssignment>();
    }
}
