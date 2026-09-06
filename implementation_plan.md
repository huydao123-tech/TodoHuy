# Cài đặt đầy đủ Session, Authentication, Authorization & JWT

Kế hoạch này sẽ nâng cấp hệ thống xác thực (Authentication) và phân quyền (Authorization) của backend Spring Boot để tuân thủ các chuẩn mực bảo mật tốt nhất (best practices), đồng thời hoàn thiện cách xử lý trên Next.js frontend.

## User Review Required

> [!IMPORTANT]
> - Việc thêm Enum Role vào database sẽ yêu cầu cập nhật lại bảng `users` (hoặc Spring Data JPA sẽ tự tạo thêm cột nếu cấu hình `update`).
> - Frontend sẽ tự động chuyển hướng về trang `/login` nếu token hết hạn (lỗi 401).

## Open Questions

- Bạn có muốn thêm vai trò `ADMIN` cho các tác vụ quản trị sau này không? Tạm thời tôi sẽ thiết kế một enum `Role` gồm `USER` và `ADMIN`, và gán mặc định `USER` khi đăng ký.
- Token hiện tại sống trong 7 ngày (604800000 ms). Bạn có muốn sử dụng cơ chế Refresh Token phức tạp hơn không, hay 1 token dài hạn là đủ cho ứng dụng cá nhân? (Đề xuất: Dùng 1 token như hiện tại cho ứng dụng cá nhân).

## Proposed Changes

### Backend (Spring Boot)

#### [NEW] CustomUserDetails.java
Tạo class implement `UserDetails` của Spring Security để bọc (wrap) entity `User`.

#### [NEW] CustomUserDetailsService.java
Tạo service implement `UserDetailsService` để load user từ database thông qua `UserRepository`.

#### [MODIFY] User.java
Thêm Enum `Role` (USER, ADMIN) vào entity `User` với annotation `@Enumerated(EnumType.STRING)`.

#### [MODIFY] SecurityConfig.java
- Bổ sung `AuthenticationManager` bean.
- Bổ sung `AuthenticationEntryPoint` (trả về lỗi 401 dạng JSON).
- Bổ sung `AccessDeniedHandler` (trả về lỗi 403 dạng JSON).
- Kích hoạt `@EnableMethodSecurity` để hỗ trợ annotation `@PreAuthorize`.

#### [MODIFY] JwtUtils.java
- Đưa thông tin `role` vào Claims (payload) của JWT.

#### [MODIFY] JwtAuthenticationFilter.java
- Cập nhật để extract role từ JWT và sử dụng `CustomUserDetailsService` (hoặc tự tạo trực tiếp CustomUserDetails từ token để tối ưu hiệu năng).

#### [MODIFY] AuthService.java
- Thay vì tự so sánh mật khẩu, sẽ sử dụng `AuthenticationManager.authenticate(...)` để Spring Security xử lý quá trình login một cách chuẩn xác.

### Frontend (Next.js)

#### [MODIFY] lib/api.ts
- Xử lý lỗi 401 toàn cục: Nếu API trả về 401 Unauthorized (token hết hạn hoặc sai), tự động xóa token và chuyển hướng `window.location.href = '/login'`.

#### [MODIFY] components/app/Dashboard.tsx
- **Fix Bug Mock Data**: Thay đổi logic load dữ liệu từ API. Nếu API trả về mảng rỗng (khi user mới chưa có dữ liệu), phải cập nhật state thành mảng rỗng thay vì giữ nguyên dữ liệu mock (`INITIAL_GROUPS`). Khởi tạo state bằng mảng rỗng, hoặc ghi đè toàn bộ dữ liệu trả về từ backend (kể cả rỗng) để tránh người dùng thao tác trên dữ liệu giả gây lỗi đồng bộ.

## Verification Plan

### Automated Tests
- Sẽ khởi động lại backend và kiểm tra các API endpoints.

### Manual Verification
1. Đăng ký tài khoản mới.
2. Đăng nhập và lấy token (chứa thông tin Role).
3. Gọi API bảo mật, xác nhận hoạt động bình thường.
4. Gửi token sai hoặc hết hạn, xác nhận backend trả về 401 JSON và frontend tự động đá văng ra màn hình đăng nhập.
5. Thử chặn quyền truy cập (nếu có API dành riêng cho ADMIN) và xác nhận trả về 403 JSON.
