using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LeonEdBackend.Models
{
    public class Student
    {
        public Guid id { get; set; }
        public Guid SchoolId { get; set; }
        public Guid UserId { get; set; }
        public Guid ClassId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public StudentGender gender {get; set;}
        public DateTime DateOfBirth { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string ParentContact { get; set; } = string.Empty;
        public string ParentEmail { get; set; } = string.Empty;
        public StudentStatus Status { get; set; }
        public DateTime EnrolledAt { get; set; }
    }

    public enum StudentGender
    {
        Male,
        Female
    }
    public enum StudentStatus
    {
        Active,
        Inactive,
        Graduated,
        Expelled
    }
}