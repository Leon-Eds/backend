using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LeonEdBackend.Models
{
    public class Teacher
    {
        public Guid id { get; set; }
        public Guid SchoolId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool isActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}