using System.ComponentModel.DataAnnotations;
using LeonEdBackend.DTOs.ScoreDtos;

namespace LeonEdBackend.DTOs.ResultDtos
{
    public class StudentResultResponse
    {
        public Guid ResultId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string TermName { get; set; } = string.Empty;
        public string SessionName { get; set; } = string.Empty;
        public decimal TotalScore { get; set; }
        public decimal Average { get; set; }
        public int Position { get; set; }
        public int SubjectCount { get; set; }
        public int TotalStudentsInClass { get; set; }
        public string Status { get; set; } = string.Empty;
        public string TeacherComment { get; set; } = string.Empty;
        public string AdminComment { get; set; } = string.Empty;
        public List<ScoreResponse> SubjectScores { get; set; } = new();
    }

    public class ClassResultSummaryResponse
    {
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string TermName { get; set; } = string.Empty;
        public string SessionName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
        public decimal ClassAverage { get; set; }
        public List<StudentResultSummary> Students { get; set; } = new();
    }

    public class StudentResultSummary
    {
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public decimal TotalScore { get; set; }
        public decimal Average { get; set; }
        public int Position { get; set; }
        public int SubjectCount { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class SubmitResultRequest
    {
        [MaxLength(500)]
        public string TeacherComment { get; set; } = string.Empty;
    }

    public class ApproveResultRequest
    {
        public bool Approve { get; set; } = true;

        [MaxLength(500)]
        public string AdminComment { get; set; } = string.Empty;
    }

    public class StudentResultCheckResponse
    {
        public bool IsFeesCleared { get; set; }
        public string Message { get; set; } = string.Empty;
        public StudentResultResponse? Result { get; set; }
    }
}
