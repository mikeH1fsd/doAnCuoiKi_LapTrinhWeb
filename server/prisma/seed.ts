import { PrismaClient, Role, UserStatus, PostStatus, CommentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  // 1. Tạo tài khoản Admin & User
  const mainAdmin = await prisma.user.upsert({
    where: { email: 'admin@ptitblog.vn' },
    update: {},
    create: {
      email: 'admin@ptitblog.vn',
      password: adminPassword,
      fullName: 'Lê Hoàng Ngọc (Admin)',
      birthYear: 2004,
      address: 'Km10 Nguyễn Trãi, Hà Đông, Hà Nội',
      phoneNumber: '0901234567',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'subadmin@ptitblog.vn' },
    update: {},
    create: {
      email: 'subadmin@ptitblog.vn',
      password: adminPassword,
      fullName: 'Quản trị viên Hệ thống',
      birthYear: 2003,
      address: 'Hà Nội',
      phoneNumber: '0907654321',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'nguyen@ptitblog.vn' },
    update: {},
    create: {
      email: 'nguyen@ptitblog.vn',
      password: userPassword,
      fullName: 'Vương Trường Nguyên',
      birthYear: 2004,
      address: 'Thanh Xuân, Hà Nội',
      phoneNumber: '0912345678',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'liem@ptitblog.vn' },
    update: {},
    create: {
      email: 'liem@ptitblog.vn',
      password: userPassword,
      fullName: 'Đỗ Thanh Liêm',
      birthYear: 2004,
      address: 'Cầu Giấy, Hà Nội',
      phoneNumber: '0987654321',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Tạo Danh mục bài viết
  const categoryData = [
    {
      name: 'Lập trình Web',
      slug: 'lap-trinh-web',
      description: 'Kiến thức về ReactJS, Node.js, Express, PostgreSQL và triển khai web hiện đại.',
    },
    {
      name: 'Trí tuệ nhân tạo',
      slug: 'tri-tue-nhan-tao',
      description: 'Tin tức, hướng dẫn về Machine Learning, Deep Learning và LLM.',
    },
    {
      name: 'Đời sống sinh viên',
      slug: 'doi-song-sinh-vien',
      description: 'Chia sẻ chuyện học tập, làm đồ án và hoạt động ngoại khóa tại PTIT.',
    },
    {
      name: 'Kỹ năng & Nghề nghiệp',
      slug: 'ky-nang-nghe-nghiep',
      description: 'Kinh nghiệm phỏng vấn, viết CV và định hướng nghề nghiệp IT.',
    },
  ];

  const categories: Record<string, number> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }

  // 3. Tạo 12 bài viết mẫu (đủ dữ liệu test phân trang, lọc, tìm kiếm, sắp xếp, ẩn/hiện)
  const postsData = [
    {
      title: 'Xây dựng ứng dụng Web chuẩn mực với ReactJS và Vite',
      slug: 'xay-dung-ung-dung-web-chuan-muc-voi-reactjs-va-vite',
      summary: 'Hướng dẫn chi tiết cách tổ chức thư mục, quản lý state và tối ưu hiệu năng khi phát triển ReactJS với Vite.',
      content: `<h2>Tại sao nên chọn Vite cho dự án React?</h2><p><strong>Vite</strong> mang lại tốc độ khởi động máy chủ phát triển gần như tức thì nhờ sử dụng ES Modules gốc của trình duyệt.</p><h3>Các bước tổ chức cấu trúc thư mục</h3><ul><li><strong>components/</strong>: Chứa các UI component tái sử dụng như Button, Modal, Pagination.</li><li><strong>pages/</strong>: Chứa các trang hoàn chỉnh tương ứng với từng route.</li><li><strong>api/</strong>: Cấu hình Axios interceptor để tự động đính kèm JWT token.</li></ul><p>Khi áp dụng cấu trúc này, nhóm 3 người có thể làm việc song song mà không bị xung đột code.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 342,
      categoryId: categories['lap-trinh-web'],
    },
    {
      title: 'Làm chủ Prisma ORM cùng PostgreSQL trên Supabase',
      slug: 'lam-chu-prisma-orm-cung-postgresql-tren-supabase',
      summary: 'Cách kết hợp Prisma ORM và Supabase PostgreSQL để xây dựng Backend an toàn kiểu dữ liệu và dễ mở rộng.',
      content: `<h2>Prisma ORM là gì?</h2><p><strong>Prisma</strong> là một ORM thế hệ mới cho Node.js và TypeScript giúp bạn định nghĩa schema rõ ràng và tự động sinh các câu truy vấn an toàn.</p><p>Khi kết hợp với <em>Supabase</em>, đội ngũ phát triển có thể dùng chung một cơ sở dữ liệu PostgreSQL trên cloud mà không cần cài đặt phức tạp ở máy cá nhân.</p><blockquote>Lưu ý cấu hình cả DATABASE_URL (Transaction Pooler) và DIRECT_URL khi chạy migration!</blockquote>`,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 289,
      categoryId: categories['lap-trinh-web'],
    },
    {
      title: 'Tích hợp trình soạn thảo TinyMCE và chống lỗ hổng XSS trong React',
      slug: 'tich-hop-trinh-soan-thao-tinymce-va-chong-xss-trong-react',
      summary: 'Tìm hiểu cách nhúng TinyMCE vào trang Admin và sử dụng DOMPurify kết hợp dangerouslySetInnerHTML để hiển thị an toàn.',
      content: `<h2>Hiển thị nội dung HTML từ Rich Text Editor</h2><p>Khi Admin soạn bài viết bằng <strong>TinyMCE</strong>, dữ liệu lưu xuống PostgreSQL là chuỗi HTML. Ở phía giao diện người đọc React, ta sử dụng <code>dangerouslySetInnerHTML</code>.</p><p>Tuy nhiên, để phòng tránh tấn công <strong>Cross-Site Scripting (XSS)</strong>, luôn luôn làm sạch chuỗi HTML qua thư viện <strong>DOMPurify</strong> trước khi render ra DOM.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 415,
      categoryId: categories['lap-trinh-web'],
    },
    {
      title: 'Hiểu đúng về JWT Authentication và Phân quyền Role-Based',
      slug: 'hieu-dung-ve-jwt-authentication-va-phan-quyen',
      summary: 'Giải thích cơ chế hoạt động của JSON Web Token và cách thiết kế middleware phân quyền User/Admin trong ExpressJS.',
      content: `<h2>JSON Web Token hoạt động như thế nào?</h2><p>Sau khi người dùng đăng nhập thành công, máy chủ ký một token chứa <code>userId</code> và <code>role</code> bằng khóa bí mật. Mỗi yêu cầu tiếp theo gửi lên header <code>Authorization: Bearer &lt;token&gt;</code> sẽ được middleware xác thực.</p><p>Nhờ vậy, các API quản trị như xóa bài viết hay quản lý tài khoản luôn được bảo vệ tuyệt đối.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 198,
      categoryId: categories['lap-trinh-web'],
    },
    {
      title: 'Ứng dụng AI và RAG trong tìm kiếm thông tin thông minh',
      slug: 'ung-dung-ai-va-rag-trong-tim-kiem-thong-tin',
      summary: 'Khám phá kiến trúc Retrieval-Augmented Generation giúp mô hình ngôn ngữ lớn trả lời chính xác dựa trên dữ liệu riêng.',
      content: `<h2>RAG là gì?</h2><p><strong>RAG (Retrieval-Augmented Generation)</strong> kết hợp khả năng tìm kiếm ngữ nghĩa từ cơ sở dữ liệu vector với năng lực tổng hợp ngôn ngữ của LLM.</p><p>Điều này giúp giảm thiểu hiện tượng ảo giác (hallucination) và dễ dàng cập nhật kiến thức mới cho hệ thống.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 512,
      categoryId: categories['tri-tue-nhan-tao'],
    },
    {
      title: 'Bí quyết làm đồ án môn Lập trình Web đạt điểm A tại PTIT',
      slug: 'bi-quyet-lam-do-an-mon-lap-trinh-web-dat-diem-a',
      summary: 'Tổng hợp những tiêu chí chấm điểm quan trọng nhất từ giảng viên và cách phân chia công việc hiệu quả cho nhóm 3 người.',
      content: `<h2>Những điểm giảng viên thường kiểm tra kỹ</h2><ul><li>Đầy đủ các chức năng CRUD cho cả User và Admin.</li><li>Mọi trang danh sách đều phải có <strong>Phân trang, Tìm kiếm, Sắp xếp và Lọc</strong>.</li><li>Giao diện phản hồi tốt, thông báo lỗi rõ ràng khi nhập sai dữ liệu.</li><li>Đóng gói Docker chạy trơn tru và triển khai được lên hosting thực tế.</li></ul>`,
      thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 680,
      categoryId: categories['doi-song-sinh-vien'],
    },
    {
      title: 'Lộ trình chuẩn bị CV và phỏng vấn Thực tập sinh Web Developer',
      slug: 'lo-trinh-chuan-bi-cv-va-phong-van-thuc-tap-sinh-web',
      summary: 'Những kỹ năng cốt lõi nhà tuyển dụng tìm kiếm ở sinh viên năm 3, năm 4 ngành Công nghệ thông tin.',
      content: `<h2>Nhà tuyển dụng cần gì ở vị trí Intern?</h2><p>Bên cạnh kiến thức nền tảng về HTML, CSS, JavaScript và cấu trúc dữ liệu, việc bạn có một dự án thực tế triển khai hoàn chỉnh online là điểm cộng cực lớn.</p><p>Hãy trình bày rõ vai trò của bạn trong dự án nhóm và những vấn đề kỹ thuật bạn đã trực tiếp giải quyết.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 254,
      categoryId: categories['ky-nang-nghe-nghiep'],
    },
    {
      title: 'Tối ưu câu truy vấn tìm kiếm và phân trang trong PostgreSQL',
      slug: 'toi-uu-cau-truy-van-tim-kiem-va-phan-trang-postgresql',
      summary: 'So sánh phân trang Offset và Cursor, cùng cách đánh index để tăng tốc độ tìm kiếm bài viết.',
      content: `<h2>Phân trang hiệu quả cho Website Blog</h2><p>Với hầu hết trang blog có số lượng bài viết vừa phải, phân trang theo số trang (Offset pagination) giúp người dùng dễ dàng nhảy tới trang bất kỳ.</p><p>Đừng quên tạo <code>@@index</code> trên các cột thường xuyên lọc như <code>categoryId</code>, <code>status</code> và <code>createdAt</code>.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 175,
      categoryId: categories['lap-trinh-web'],
    },
    {
      title: 'Prompt Engineering hiệu quả cho lập trình viên',
      slug: 'prompt-engineering-hieu-qua-cho-lap-trinh-vien',
      summary: 'Cách đặt câu hỏi và cung cấp ngữ cảnh đúng cách khi sử dụng trợ lý AI trong quá trình phát triển phần mềm.',
      content: `<h2>Cung cấp ngữ cảnh rõ ràng</h2><p>Thay vì yêu cầu chung chung, hãy mô tả rõ stack công nghệ, cấu trúc schema hiện tại và yêu cầu đầu ra mong muốn. Việc chia nhỏ tác vụ theo từng bước giúp chất lượng code sinh ra chính xác hơn rất nhiều.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 310,
      categoryId: categories['tri-tue-nhan-tao'],
    },
    {
      title: 'Kinh nghiệm làm việc nhóm Git Flow không bị xung đột code',
      slug: 'kinh-nghiem-lam-viec-nhom-git-flow-khong-bi-conflict',
      summary: 'Quy tắc tạo nhánh feature, viết commit message chuẩn và review Pull Request cho nhóm sinh viên.',
      content: `<h2>Quy tắc vàng khi code chung repo</h2><p>Không bao giờ push trực tiếp lên nhánh <code>main</code>. Mỗi thành viên tạo nhánh riêng theo chức năng như <code>feat/admin-posts</code> hoặc <code>feat/user-profile</code>, sau đó tạo Pull Request để cả nhóm review trước khi merge.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.PUBLISHED,
      views: 229,
      categoryId: categories['ky-nang-nghe-nghiep'],
    },
    {
      title: '[Bản nháp] Hướng dẫn đóng gói Docker và triển khai lên Render',
      slug: 'huong-dan-dong-goi-docker-va-trien-khai-render',
      summary: 'Bài viết nháp chuẩn bị cho giai đoạn CLO2 đóng gói toàn bộ hệ thống Blog.',
      content: `<p>Bài viết này đang ở trạng thái <strong>DRAFT</strong> để kiểm thử chức năng lọc trạng thái trong trang Quản trị viên.</p>`,
      thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=900&q=80',
      status: PostStatus.DRAFT,
      views: 0,
      categoryId: categories['lap-trinh-web'],
    },
    {
      title: '[Đã ẩn] Ghi chú nội bộ kiểm thử chức năng Ẩn/Hiện bài viết',
      slug: 'ghi-chu-noi-bo-kiem-thu-an-hien-bai-viet',
      summary: 'Bài viết bị ẩn để xác minh người dùng ngoài trang chủ không nhìn thấy bài viết HIDDEN.',
      content: `<p>Nội dung này đang ở trạng thái <strong>HIDDEN</strong>. Chỉ Admin trong trang quản trị mới có thể xem và bật hiển thị lại.</p>`,
      thumbnail: null,
      status: PostStatus.HIDDEN,
      views: 15,
      categoryId: categories['doi-song-sinh-vien'],
    },
  ];

  const createdPosts = [];
  for (const post of postsData) {
    const p = await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        authorId: mainAdmin.id,
      },
    });
    createdPosts.push(p);
  }

  // 4. Tạo Bình luận mẫu cho 2 bài viết đầu tiên (nếu chưa có bình luận nào)
  const existingCommentsCount = await prisma.comment.count();
  if (existingCommentsCount === 0 && createdPosts.length >= 2) {
    await prisma.comment.createMany({
      data: [
        {
          content: 'Bài viết rất chi tiết và dễ hiểu! Nhóm mình cũng đang dùng Vite + ReactJS cho đồ án kỳ này.',
          postId: createdPosts[0].id,
          userId: user1.id,
          status: CommentStatus.ACTIVE,
        },
        {
          content: 'Cấu trúc thư mục chia theo components, pages, api rất gọn gàng, cảm ơn tác giả.',
          postId: createdPosts[0].id,
          userId: user2.id,
          status: CommentStatus.ACTIVE,
        },
        {
          content: 'Mình đã kết nối thành công Supabase với Prisma nhờ lưu ý phần DIRECT_URL!',
          postId: createdPosts[1].id,
          userId: user1.id,
          status: CommentStatus.ACTIVE,
        },
      ],
    });
  }

  console.log('✅ Khởi tạo dữ liệu mẫu thành công!');
  console.log('   - Admin: admin@ptitblog.vn / Admin@123');
  console.log('   - User : nguyen@ptitblog.vn / User@123');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
