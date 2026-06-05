using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class Score
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Guid StudentId { get; set; }

        public Guid SubjectId { get; set; }

        public Guid ClassId { get; set; }

        public Guid TermId { get; set; }

        public Guid AcademicSessionId { get; set; }

        /// <summary>First Continuous Assessment (max 20)</summary>
        public decimal FirstCA { get; set; }

        /// <summary>Second Continuous Assessment (max 20)</summary>
        public decimal SecondCA { get; set; }

        /// <summary>Exam score (max 60)</summary>
        public decimal Exam { get; set; }

        /// <summary>Computed: FirstCA + SecondCA + Exam (max 100)</summary>
        public decimal Total { get; set; }

        /// <summary>Computed from grading rules</summary>
        public Grade Grade { get; set; }

        [MaxLength(200)]
        public string Remark { get; set; } = string.Empty;

        public Guid? EnteredByTeacherId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public School School { get; set; } = null!;
        public Student Student { get; set; } = null!;
        public Subject Subject { get; set; } = null!;
        public Class Class { get; set; } = null!;
        public Term Term { get; set; } = null!;
        public AcademicSession AcademicSession { get; set; } = null!;
        public Teacher? EnteredByTeacher { get; set; }
    }
}
