namespace LeonEdBackend.Helpers
{
    public enum UserRole
    {
        SuperAdmin,
        SchoolAdmin,
        Teacher,
        Student
    }

    public enum SubscriptionPlan
    {
        Free,
        Plus,
        Premium
    }

    public enum SubscriptionStatus
    {
        Active,
        Suspended,
        Expired
    }

    public enum StudentStatus
    {
        Active,
        Graduated,
        Archived,
        Suspended
    }

    public enum Gender
    {
        Male,
        Female
    }

    public enum TermNumber
    {
        First = 1,
        Second = 2,
        Third = 3
    }

    public enum ResultStatus
    {
        Draft,
        Submitted,
        Approved,
        Published
    }

    public enum Grade
    {
        A,
        B,
        C,
        D,
        E,
        F
    }

    public enum PaymentStatus
    {
        Pending,
        Cleared,
        Rejected
    }

    public enum AdmissionStatus
    {
        Pending,
        Approved,
        Rejected
    }
}