using LeonEdBackend.DTOs.TeacherDtos;

namespace LeonEdBackend.DTOs.DashboardDtos
{
    public class SchoolDashboardResponse
    {
        public Guid SchoolId { get; set; }
        public string SchoolName { get; set; } = string.Empty;
        public string SubscriptionPlan { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
        public int TotalTeachers { get; set; }
        public int TotalClasses { get; set; }
        public int TotalSubjects { get; set; }
        public int MaxStudents { get; set; }
        public int MaxTeachers { get; set; }
        public string? CurrentSession { get; set; }
        public string? CurrentTerm { get; set; }
    }

    public class SuperAdminDashboardResponse
    {
        public int TotalSchools { get; set; }
        public int ActiveSchools { get; set; }
        public int SuspendedSchools { get; set; }
        public int TotalStudentsAcrossSchools { get; set; }
        public int TotalTeachersAcrossSchools { get; set; }
        public PlanBreakdown PlanBreakdown { get; set; } = new();
    }

    public class PlanBreakdown
    {
        public int FreeSchools { get; set; }
        public int PlusSchools { get; set; }
        public int PremiumSchools { get; set; }
    }

    public class TeacherDashboardResponse
    {
        public Guid TeacherId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int TotalAssignedSubjects { get; set; }
        public int TotalAssignedClasses { get; set; }
        public string? CurrentSession { get; set; }
        public string? CurrentTerm { get; set; }
        public List<TeacherAssignmentResponse> Assignments { get; set; } = new();
    }

    public class StudentDashboardResponse
    {
        public Guid StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public string? ClassName { get; set; }
        public string? ClassArm { get; set; }
        public string? CurrentSession { get; set; }
        public string? CurrentTerm { get; set; }
    }
}
