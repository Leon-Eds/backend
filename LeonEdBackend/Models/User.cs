using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LeonEdBackend.Models
{
    public class User
    {
        public Guid id { get; set; }
        public Guid? SchoolId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public required string Password { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime LastLogin { get; set; }
        public DateTime CreatedAt { get; set; }

    }

    public enum UserRole
    {
        SuperAdmin,
        SchoolAdmin,
        Teacher,
        Student
    }
}