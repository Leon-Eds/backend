namespace LeonEdBackend.Models
{
    public class TeacherSubjectAssignment
    {
        public Guid Id { get; set; }

        public Guid TeacherId { get; set; }

        public Guid SubjectId { get; set; }

        public Guid ClassId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Teacher Teacher { get; set; } = null!;
        public Subject Subject { get; set; } = null!;
        public Class Class { get; set; } = null!;
    }
}
