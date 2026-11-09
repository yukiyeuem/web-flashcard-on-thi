import { Exam, Question, Topic, User, AuditLog } from '../types';

export const SEED_USERS: User[] = [
  {
    id: 'user-admin-huyhoang',
    email: 'huyhoangpham387@gmail.com',
    name: 'Huy Hoàng (Lead Admin)',
    role: 'ADMIN',
    status: 'ACTIVE',
    email_verified_at: 1700000000000,
    created_at: 1700000000000,
    last_login_at: 1700050000000
  },
  {
    id: 'user-learner-1',
    email: 'user@certflash.io',
    name: 'Học Viên Demo (AWS & Azure Candidate)',
    role: 'USER',
    status: 'ACTIVE',
    email_verified_at: 1700100000000,
    created_at: 1700100000000,
    last_login_at: 1700120000000
  },
  {
    id: 'user-pending-1',
    email: 'phuong.thao@techmail.vn',
    name: 'Nguyễn Phương Thảo',
    role: 'USER',
    status: 'PENDING',
    email_verified_at: 1700200000000,
    created_at: 1700200000000
  },
  {
    id: 'user-unverified-1',
    email: 'chua.xac.thuc@gmail.com',
    name: 'Trần Văn Nam',
    role: 'USER',
    status: 'PENDING_VERIFICATION',
    email_verified_at: null,
    created_at: 1700210000000
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    actor_id: 'user-admin-huyhoang',
    actor_email: 'huyhoangpham387@gmail.com',
    action: 'APPROVE_USER',
    target_id: 'user-learner-1',
    target_email: 'user@certflash.io',
    details: 'Đã duyệt tài khoản sau khi xác minh email thành công.',
    timestamp: 1700100500000
  }
];

export const SEED_EXAMS: Exam[] = [
  {
    id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    code: 'SAA-C03',
    title: 'AWS Certified Solutions Architect – Associate',
    description: 'Chứng chỉ kiến trúc sư giải pháp điện toán đám mây AWS hàng đầu thế giới. Tập trung thiết kế hệ thống có tính sẵn sàng cao, tối ưu chi phí và bảo mật.',
    icon: 'Cloud',
    color: '#f59e0b',
    passing_score: 72,
    default_time_minutes: 130,
    is_preset: true,
    created_at: 1700000000000,
    updated_at: 1700000000000
  },
  {
    id: 'exam-az-104',
    user_id: 'user-learner-1',
    code: 'AZ-104',
    title: 'Microsoft Certified: Azure Administrator Associate',
    description: 'Quản trị hạ tầng đám mây Microsoft Azure: Identity, Governance, Compute, Storage và Virtual Networks.',
    icon: 'Server',
    color: '#0284c7',
    passing_score: 70,
    default_time_minutes: 120,
    is_preset: true,
    created_at: 1700010000000,
    updated_at: 1700010000000
  },
  {
    id: 'exam-psm-1',
    user_id: 'user-learner-1',
    code: 'PSM I',
    title: 'Professional Scrum Master I',
    description: 'Chứng chỉ Scrum Master quốc tế từ Scrum.org, kiểm tra độ hiểu sâu sắc về Scrum Framework, các vai trò, sự kiện và tạo tác.',
    icon: 'Award',
    color: '#10b981',
    passing_score: 85,
    default_time_minutes: 60,
    is_preset: true,
    created_at: 1700020000000,
    updated_at: 1700020000000
  }
];

export const SEED_TOPICS: Topic[] = [
  // AWS SAA Topics
  { id: 'topic-aws-compute', exam_id: 'exam-aws-saa', user_id: 'user-learner-1', name: 'Compute & Auto Scaling', color: '#f59e0b', description: 'EC2, ECS, EKS, Lambda, Auto Scaling Groups' },
  { id: 'topic-aws-storage', exam_id: 'exam-aws-saa', user_id: 'user-learner-1', name: 'Storage & S3', color: '#3b82f6', description: 'S3 storage classes, EBS volumes, EFS, Glacier' },
  { id: 'topic-aws-network', exam_id: 'exam-aws-saa', user_id: 'user-learner-1', name: 'Networking & VPC', color: '#8b5cf6', description: 'VPC, Subnets, NAT Gateway, Route 53, CloudFront' },
  { id: 'topic-aws-database', exam_id: 'exam-aws-saa', user_id: 'user-learner-1', name: 'Databases & Cache', color: '#ec4899', description: 'RDS, Aurora Serverless, DynamoDB, ElastiCache' },
  { id: 'topic-aws-security', exam_id: 'exam-aws-saa', user_id: 'user-learner-1', name: 'Security & IAM', color: '#ef4444', description: 'IAM policies, KMS, Secrets Manager, Shield, WAF' },

  // Azure AZ-104 Topics
  { id: 'topic-az-identity', exam_id: 'exam-az-104', user_id: 'user-learner-1', name: 'Azure Active Directory & Governance', color: '#0284c7' },
  { id: 'topic-az-network', exam_id: 'exam-az-104', user_id: 'user-learner-1', name: 'Virtual Networking & DNS', color: '#0d9488' },
  { id: 'topic-az-compute', exam_id: 'exam-az-104', user_id: 'user-learner-1', name: 'Compute & Virtual Machines', color: '#6366f1' },
  { id: 'topic-az-storage', exam_id: 'exam-az-104', user_id: 'user-learner-1', name: 'Storage Accounts & Blob', color: '#d97706' },

  // PSM I Topics
  { id: 'topic-psm-roles', exam_id: 'exam-psm-1', user_id: 'user-learner-1', name: 'Scrum Roles & Accountabilities', color: '#10b981' },
  { id: 'topic-psm-events', exam_id: 'exam-psm-1', user_id: 'user-learner-1', name: 'Scrum Events & Timeboxes', color: '#14b8a6' },
  { id: 'topic-psm-artifacts', exam_id: 'exam-psm-1', user_id: 'user-learner-1', name: 'Artifacts & Definition of Done', color: '#84cc16' }
];

export const SEED_QUESTIONS: Question[] = [
  // Question 1: AWS - SINGLE
  {
    id: 'q-aws-01',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'SINGLE',
    content: 'Một công ty cần lưu trữ các tệp báo cáo tài chính hàng quý. Các tệp này cần truy cập tức thì (immediate access) trong 30 ngày đầu tiên. Sau 30 ngày, tệp hiếm khi được truy cập nhưng khi cần thì phải truy xuất trong vòng vài phút. Chi phí lưu trữ cần được tối ưu nhất. Giải pháp nào phù hợp nhất?',
    options: [
      { key: 'A', text: 'S3 Standard chuyển sang S3 Glacier Flexible Retrieval sau 30 ngày bằng Lifecycle Rule.' },
      { key: 'B', text: 'S3 Standard chuyển sang S3 Glacier Deep Archive sau 30 ngày.' },
      { key: 'C', text: 'S3 Intelligent-Tiering ngay từ đầu không cần cấu hình vòng đời.' },
      { key: 'D', text: 'S3 Standard chuyển sang S3 One Zone-IA sau 30 ngày.' }
    ],
    correct: ['A'],
    answer_content: null,
    explanation: 'S3 Glacier Flexible Retrieval hỗ trợ tùy chọn Expedited retrieval (1-5 phút), đáp ứng yêu cầu "vài phút" khi cần gấp với chi phí lưu trữ rất thấp sau 30 ngày. Deep Archive mất từ 12-48 giờ nên không thỏa mãn.',
    topics: ['topic-aws-storage'],
    difficulty: 2,
    source: 'PRESET',
    version: 1,
    created_at: 1700001000000,
    updated_at: 1700001000000
  },

  // Question 2: AWS - MULTI
  {
    id: 'q-aws-02',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'MULTI',
    content: 'Một ứng dụng web thương mại điện tử chạy trên EC2 instances trong private subnets cần giao tiếp an toàn với Amazon DynamoDB mà không truyền lưu lượng qua public Internet. Hai giải pháp nào kết hợp đáp ứng yêu cầu này? (Chọn 2)',
    options: [
      { key: 'A', text: 'Tạo một VPC Gateway Endpoint cho Amazon DynamoDB.' },
      { key: 'B', text: 'Cập nhật Route Table của private subnet để trỏ prefix list của DynamoDB đến VPC Endpoint.' },
      { key: 'C', text: 'Thiết lập NAT Gateway trong public subnet.' },
      { key: 'D', text: 'Tạo AWS Direct Connect kết nối tới DynamoDB.' },
      { key: 'E', text: 'Mở Internet Gateway trên VPC và gán Elastic IP cho các EC2 instance.' }
    ],
    correct: ['A', 'B'],
    answer_content: null,
    explanation: 'DynamoDB và S3 là hai dịch vụ hỗ trợ Gateway VPC Endpoints miễn phí. Khi tạo Gateway Endpoint, bạn cấu hình Route Table của private subnet trỏ lưu lượng tới DynamoDB thông qua Endpoint mà không đi qua Internet.',
    topics: ['topic-aws-network', 'topic-aws-database'],
    difficulty: 2,
    source: 'PRESET',
    version: 1,
    created_at: 1700002000000,
    updated_at: 1700002000000
  },

  // Question 3: AWS - FLASHCARD (ADD-04 mandatory answer_content)
  {
    id: 'q-aws-03',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'FLASHCARD',
    content: 'Sự khác biệt cốt lõi giữa Amazon S3 Transfer Acceleration và Amazon CloudFront là gì?',
    options: [],
    correct: [],
    answer_content: '• Amazon CloudFront: CDN toàn cầu dùng để cache và phục vụ nội dung đọc (read-heavy, static/dynamic assets) từ Edge Locations đến người dùng gần nhất.\n\n• S3 Transfer Acceleration: Tối ưu hóa tốc độ UPLOAD (ghi dữ liệu vào S3 bucket) qua khoảng cách địa lý xa bằng cách định tuyến lưu lượng qua mạng trục tối ưu của AWS Edge Locations thẳng vào S3 bucket.',
    explanation: 'Mẹo nhớ: CloudFront chuyên về Delivery (Download/Cache), còn S3 Transfer Acceleration chuyên về Fast Uploads over long distance.',
    topics: ['topic-aws-storage', 'topic-aws-network'],
    difficulty: 2,
    source: 'PRESET',
    version: 1,
    created_at: 1700003000000,
    updated_at: 1700003000000
  },

  // Question 4: AWS - SINGLE
  {
    id: 'q-aws-04',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'SINGLE',
    content: 'Một kiến trúc sư giải pháp cần thiết kế cơ sở dữ liệu quan hệ cho ứng dụng giao dịch tài chính yêu cầu khả năng tự động sao chép qua nhiều Availability Zones (Multi-AZ), khả năng scale read replicas lên tới 15 bản sao và tự phục hồi lưu trữ. Dịch vụ nào tốt nhất?',
    options: [
      { key: 'A', text: 'Amazon RDS for PostgreSQL Multi-AZ deployment.' },
      { key: 'B', text: 'Amazon Aurora PostgreSQL.' },
      { key: 'C', text: 'Amazon DynamoDB Global Tables.' },
      { key: 'D', text: 'Amazon Redshift Serverless cluster.' }
    ],
    correct: ['B'],
    answer_content: null,
    explanation: 'Amazon Aurora hỗ trợ tối đa 15 Aurora Replicas với độ trễ tính bằng mili-giây, tự động sao chép 6 bản lưu trữ phân tán trên 3 AZ và tự phục hồi ổ cứng. RDS for PostgreSQL tiêu chuẩn chỉ hỗ trợ tối đa 5 Read Replicas.',
    topics: ['topic-aws-database'],
    difficulty: 2,
    source: 'PRESET',
    version: 1,
    created_at: 1700004000000,
    updated_at: 1700004000000
  },

  // Question 5: AWS - FLASHCARD
  {
    id: 'q-aws-05',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'FLASHCARD',
    content: 'Phân biệt RTO (Recovery Time Objective) và RPO (Recovery Point Objective) trong chiến lược Disaster Recovery?',
    options: [],
    correct: [],
    answer_content: '• RTO (Recovery Time Objective): Thời gian tối đa chấp nhận được để khôi phục hệ thống hoạt động trở lại sau sự cố (Đo lường thời gian gián đoạn / downtime).\n\n• RPO (Recovery Point Objective): Lượng dữ liệu tối đa chấp nhận bị mất mát tính theo thời gian kể từ bản sao lưu gần nhất (Đo lường mất mát dữ liệu / data loss).',
    explanation: 'Ví dụ: RTO = 2 giờ nghĩa là sau 2 tiếng hệ thống phải online. RPO = 15 phút nghĩa là dữ liệu trong 15 phút vừa qua có thể bị mất.',
    topics: ['topic-aws-compute', 'topic-aws-storage'],
    difficulty: 1,
    source: 'PRESET',
    version: 1,
    created_at: 1700005000000,
    updated_at: 1700005000000
  },

  // Question 6: AWS - SINGLE
  {
    id: 'q-aws-06',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'SINGLE',
    content: 'Doanh nghiệp muốn bảo vệ ứng dụng web chống lại các cuộc tấn công phổ biến như SQL Injection và Cross-Site Scripting (XSS). Dịch vụ bảo mật AWS nào giải quyết trực tiếp vấn đề này?',
    options: [
      { key: 'A', text: 'AWS Shield Standard.' },
      { key: 'B', text: 'AWS WAF (Web Application Firewall).' },
      { key: 'C', text: 'Amazon GuardDuty.' },
      { key: 'D', text: 'AWS Security Hub.' }
    ],
    correct: ['B'],
    answer_content: null,
    explanation: 'AWS WAF cho phép theo dõi và lọc các yêu cầu HTTP/HTTPS được chuyển tiếp đến CloudFront, ALB, API Gateway hoặc AppSync, với các rule bảo vệ chống SQLi, XSS và OWASP Top 10.',
    topics: ['topic-aws-security'],
    difficulty: 1,
    source: 'PRESET',
    version: 1,
    created_at: 1700006000000,
    updated_at: 1700006000000
  },

  // Question 7: AWS - FLASHCARD
  {
    id: 'q-aws-07',
    exam_id: 'exam-aws-saa',
    user_id: 'user-learner-1',
    type: 'FLASHCARD',
    content: 'Khi nào nên sử dụng SQS Dead-Letter Queue (DLQ) và số lần maxReceiveCount có ý nghĩa gì?',
    options: [],
    correct: [],
    answer_content: '• Dead-Letter Queue (DLQ): Là một hàng đợi đặc biệt để lưu giữ các thông điệp (messages) mà consumer không thể xử lý thành công sau nhiều lần thử, ngăn chặn thông điệp độc hại làm tắc nghẽn queue chính.\n\n• maxReceiveCount: Số lần tối đa một consumer có thể nhận và xử lý lỗi thông điệp đó trước khi SQS tự động chuyển nó sang DLQ để điều tra.',
    explanation: 'DLQ giúp debug các payload lỗi mà không làm nghẽn tiến trình của toàn hệ thống.',
    topics: ['topic-aws-compute'],
    difficulty: 2,
    source: 'PRESET',
    version: 1,
    created_at: 1700007000000,
    updated_at: 1700007000000
  },

  // Azure Question 1: AZ-104 - SINGLE
  {
    id: 'q-az-01',
    exam_id: 'exam-az-104',
    user_id: 'user-learner-1',
    type: 'SINGLE',
    content: 'Bạn là Azure Administrator. Bạn cần cấp quyền cho một nhóm người dùng để họ có thể tạo và quản lý Virtual Machines trong một Resource Group cụ thể nhưng KHÔNG được cấp quyền thay đổi Virtual Network hoặc Network Security Groups. Role nào phù hợp nhất theo nguyên tắc Least Privilege?',
    options: [
      { key: 'A', text: 'Contributor trên Resource Group.' },
      { key: 'B', text: 'Virtual Machine Contributor trên Resource Group.' },
      { key: 'C', text: 'Owner trên Resource Group.' },
      { key: 'D', text: 'Virtual Machine Administrator Login.' }
    ],
    correct: ['B'],
    answer_content: null,
    explanation: 'Role Virtual Machine Contributor cho phép quản trị viên quản lý VMs (restart, resize, delete, create) nhưng không có quyền can thiệp vào VNet hoặc Subnet cấu hình mạng liên quan.',
    topics: ['topic-az-identity', 'topic-az-compute'],
    difficulty: 2,
    source: 'PRESET',
    version: 1,
    created_at: 1700011000000,
    updated_at: 1700011000000
  },

  // Azure Question 2: AZ-104 - FLASHCARD
  {
    id: 'q-az-02',
    exam_id: 'exam-az-104',
    user_id: 'user-learner-1',
    type: 'FLASHCARD',
    content: 'Sự khác nhau giữa LRS (Locally Redundant Storage) và ZRS (Zone-Redundant Storage) trong Azure Storage?',
    options: [],
    correct: [],
    answer_content: '• LRS (Locally Redundant): Sao chép dữ liệu 3 lần đồng bộ trong một Data Center duy nhất (Single facility). Rẻ nhất nhưng nếu cả Data Center gặp thiên tai dữ liệu sẽ bị gián đoạn.\n\n• ZRS (Zone-Redundant): Sao chép dữ liệu 3 lần đồng bộ qua 3 Availability Zones độc lập trong cùng một Azure Region. Đảm bảo độ sẵn sàng 99.9999999999% (12 số 9) ngay cả khi mất điện một trung tâm dữ liệu.',
    explanation: 'ZRS phù hợp với các ứng dụng yêu cầu High Availability mà không cần sang Region thứ hai (như GRS).',
    topics: ['topic-az-storage'],
    difficulty: 1,
    source: 'PRESET',
    version: 1,
    created_at: 1700012000000,
    updated_at: 1700012000000
  },

  // PSM Question 1: PSM I - SINGLE
  {
    id: 'q-psm-01',
    exam_id: 'exam-psm-1',
    user_id: 'user-learner-1',
    type: 'SINGLE',
    content: 'Trong một Sprint, ai là người chịu trách nhiệm xác định "Definition of Done" nếu tổ chức chưa có tiêu chuẩn chung?',
    options: [
      { key: 'A', text: 'Chỉ riêng Product Owner.' },
      { key: 'B', text: 'Chỉ riêng Scrum Master.' },
      { key: 'C', text: 'Scrum Team (gồm PO, Developers, và Scrum Master).' },
      { key: 'D', text: 'Ban quản lý chất lượng (QA Management).' }
    ],
    correct: ['C'],
    answer_content: null,
    explanation: 'Theo Scrum Guide 2020: Nếu Definition of Done chưa là tiêu chuẩn của tổ chức, Scrum Team phải tạo ra một Definition of Done phù hợp cho sản phẩm.',
    topics: ['topic-psm-artifacts'],
    difficulty: 1,
    source: 'PRESET',
    version: 1,
    created_at: 1700021000000,
    updated_at: 1700021000000
  },

  // PSM Question 2: PSM I - FLASHCARD
  {
    id: 'q-psm-02',
    exam_id: 'exam-psm-1',
    user_id: 'user-learner-1',
    type: 'FLASHCARD',
    content: 'Mục đích chính của Sprint Retrospective là gì và thời lượng timebox cho Sprint 1 tháng là bao lâu?',
    options: [],
    correct: [],
    answer_content: '• Mục đích: Scrum Team kiểm tra (inspect) lại cách họ đã làm việc trong Sprint vừa qua về con người, quy trình, công cụ và Definition of Done; đồng thời lập kế hoạch cải tiến chất lượng và hiệu quả công việc cho Sprint tiếp theo.\n\n• Timebox: Tối đa 3 giờ cho Sprint kéo dài 1 tháng (ngắn hơn đối với các Sprint ngắn hơn).',
    explanation: 'Sprint Retrospective là cơ hội cải tiến liên tục (Kaizen) của toàn bộ Scrum Team.',
    topics: ['topic-psm-events'],
    difficulty: 1,
    source: 'PRESET',
    version: 1,
    created_at: 1700022000000,
    updated_at: 1700022000000
  }
];
