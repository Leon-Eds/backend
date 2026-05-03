using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.Models
{
    public class Teacher
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Guid UserId { get; set; }

        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Phone { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public School School { get; set; } = null!;
        public User User { get; set; } = null!;
        public ICollection<TeacherSubjectAssignment> SubjectAssignments { get; set; } = new List<TeacherSubjectAssignment>();
    }
}