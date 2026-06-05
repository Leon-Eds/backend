namespace LeonEdBackend.Models
{
    public class ClassSubject
    {
        public Guid Id { get; set; }

        public Guid ClassId { get; set; }

        public Guid SubjectId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Class Class { get; set; } = null!;
        public Subject Subject { get; set; } = null!;
    }
}
