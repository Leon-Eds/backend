using LeonEdBackend.DTOs.ScoreDtos;

namespace LeonEdBackend.DTOs.ReportCardDtos
{
    public class ReportCardResponse
    {
        // School info
        public string SchoolName { get; set; } = string.Empty;
        public string SchoolAddress { get; set; } = string.Empty;
        public string SchoolEmail { get; set; } = string.Empty;
        public string SchoolPhone { get; set; } = string.Empty;
        public string SchoolLogoUrl { get; set; } = string.Empty;

        // Student info
        public string StudentName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;

        // Academic info
        public string AcademicSession { get; set; } = string.Empty;
        public string Term { get; set; } = string.Empty;

        // Result summary
        public decimal TotalScore { get; set; }
        public decimal Average { get; set; }
        public int Position { get; set; }
        public int TotalStudentsInClass { get; set; }
        public int SubjectCount { get; set; }

        // Subject scores
        public List<ScoreResponse> SubjectScores { get; set; } = new();

        // Comments
        public string TeacherComment { get; set; } = string.Empty;
        public string AdminComment { get; set; } = string.Empty;

        // Grading key
        public List<GradingKeyEntry> GradingKey { get; set; } = new();
    }

    public class GradingKeyEntry
    {
        public string Grade { get; set; } = string.Empty;
        public int MinScore { get; set; }
        public int MaxScore { get; set; }
        public string Remark { get; set; } = string.Empty;
    }
}
