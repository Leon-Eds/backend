using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.DTOs.ScoreDtos
{
    public class EnterScoreRequest
    {
        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid SubjectId { get; set; }

        [Required]
        public Guid ClassId { get; set; }

        [Required]
        public Guid TermId { get; set; }

        [Required]
        public Guid AcademicSessionId { get; set; }

        [Range(0, 20)]
        public decimal FirstCA { get; set; }

        [Range(0, 20)]
        public decimal SecondCA { get; set; }

        [Range(0, 60)]
        public decimal Exam { get; set; }

        [MaxLength(200)]
        public string Remark { get; set; } = string.Empty;
    }

    public class BulkScoreEntry
    {
        [Required]
        public Guid StudentId { get; set; }

        [Range(0, 20)]
        public decimal FirstCA { get; set; }

        [Range(0, 20)]
        public decimal SecondCA { get; set; }

        [Range(0, 60)]
        public decimal Exam { get; set; }

        [MaxLength(200)]
        public string Remark { get; set; } = string.Empty;
    }

    public class BulkEnterScoresRequest
    {
        [Required]
        public Guid SubjectId { get; set; }

        [Required]
        public Guid ClassId { get; set; }

        [Required]
        public Guid TermId { get; set; }

        [Required]
        public Guid AcademicSessionId { get; set; }

        [Required]
        public List<BulkScoreEntry> Scores { get; set; } = new();
    }

    public class ScoreResponse
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public decimal FirstCA { get; set; }
        public decimal SecondCA { get; set; }
        public decimal Exam { get; set; }
        public decimal Total { get; set; }
        public string Grade { get; set; } = string.Empty;
        public string Remark { get; set; } = string.Empty;
    }

    public class ClassScoreSheetResponse
    {
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string TermName { get; set; } = string.Empty;
        public string SessionName { get; set; } = string.Empty;
        public List<ScoreResponse> Scores { get; set; } = new();
    }
}
