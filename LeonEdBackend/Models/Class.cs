using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LeonEdBackend.Models
{
    public class Class
    {
        public Guid id { get; set; }
        public Guid SchoolId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}