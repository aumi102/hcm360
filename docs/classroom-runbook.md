# Sổ tay chạy trên lớp — ĐẠO ĐỨC 360

Dành cho người bấm máy trong buổi thuyết trình Chủ đề 8. Đọc một lần trước buổi học,
mang theo trang này khi lên lớp.

---

## A. Trước buổi học (làm ở nhà, 10 phút)

1. **Xác nhận địa chỉ production** đang chạy: mở trang chủ, phải là `https://`, đúng tên
   miền của bản triển khai — không phải địa chỉ preview.
2. Đăng nhập `/host` **một lần** trên đúng chiếc máy sẽ mang lên lớp. Cookie sống 12 giờ.
3. **Kiểm tra không có nhãn "chế độ bộ nhớ tạm"** ở bảng điều khiển. Nếu có, bản triển
   khai chưa nối Supabase — xem [`DEPLOYMENT.md`](./DEPLOYMENT.md) mục C, không sửa kịp
   tại lớp.
4. **Tạo một phòng thử**, chạy trọn một ván: mở màn chiếu, quét QR bằng **điện thoại dùng
   mạng di động** (không dùng Wi-Fi lớp — đây là cách duy nhất kiểm tra được rằng mã QR
   trỏ ra địa chỉ công khai thật chứ không phải địa chỉ nội bộ).
5. **Đóng phòng thử**: bấm **Kết thúc sớm** rồi **Tạo phòng mới**, để hôm sau không lẫn
   với phòng cũ.
6. Đọc lướt [`question-set.md`](./question-set.md). Chọn trước **một hoặc hai câu** sẽ
   dừng lại phân tích; những câu còn lại thì lướt nhanh. Đây là biến số quyết định trò
   chơi gọn trong 5 phút hay kéo thành 12.
7. **In sẵn** [`question-set.md`](./question-set.md) — phương án dự phòng ở mục G.

## B. Ngay trước khi chơi (2 phút, trong lúc còn đang nói)

1. Máy giảng viên: mở **`/host`**.
2. Bấm **Tạo phòng**. Mã 5 chữ cái hiện ra.
3. Bấm **Mở màn chiếu ↗** — tab mới ở `/room/<MÃ>`. Kéo tab này sang máy chiếu và bật
   toàn màn hình (`F11`).
4. Kiểm tra trên màn chiếu: tên trò chơi lớn, **mã QR**, **mã phòng**, số người đang là 0.

> Giữ tab `/host` trên màn hình máy tính xách tay, **không** chiếu nó lên. Tab điều khiển
> hiển thị đáp án đúng.

## C. Cho sinh viên vào phòng (45 giây)

1. Nói: *"Mở camera điện thoại, quét mã QR trên màn hình, nhập tên của bạn."*
2. Ai không quét được thì đọc địa chỉ và mã phòng đang hiện dưới mã QR.
3. Theo dõi số người tăng dần trên màn chiếu.
4. Khi số người đã ổn định (khoảng 90% lớp), bấm **Khoá không cho vào thêm** — không bắt
   buộc, nhưng tránh việc người vào muộn làm sai lệch thống kê.

**Chờ đến bao giờ?** Đừng chờ 100%. Chờ đến khi số người đứng yên khoảng 5 giây rồi bắt
đầu. Người vào muộn không tham gia được ván này, và điều đó chấp nhận được.

## D. Chạy trò chơi (khoảng 4 phút)

Với mỗi câu trong số 7 câu:

1. Bấm **Bắt đầu** (câu 1) hoặc **Câu tiếp theo** (các câu sau).
2. Đọc to đề bài trên màn chiếu. Sinh viên có 20–28 giây.
3. Theo dõi ô **Đã trả lời** trên bảng điều khiển. Khi gần hết lớp đã trả lời, có thể bấm
   **Công bố đáp án** sớm thay vì chờ hết giờ — đây là cách giữ nhịp tốt nhất.
4. Màn chiếu hiện đáp án đúng, giải thích ngắn và phần trăm từng phương án.
5. Bình luận **một câu** rồi đi tiếp. Chỉ dừng phân tích sâu ở câu bạn đã chọn trước.

Câu 7 khó nhất, đặt ở cuối để tách bảng xếp hạng.

## E. Kết thúc (30 giây)

1. Sau câu 7, bấm **Kết thúc & xem Top 5**.
2. Màn chiếu hiện bục Top 5 kèm thống kê lớp: số người chơi, điểm trung bình, tỷ lệ đúng,
   **câu khó nhất**.
3. Câu khó nhất là điểm vào tự nhiên cho phần kết: *"Câu này cả lớp sai nhiều nhất — vì
   sao?"*
4. Muốn chơi lại ngay với cùng nhóm: bấm **Chơi lại với nhóm này** (xoá câu trả lời, đưa
   điểm về 0, giữ nguyên danh sách). Muốn phòng hoàn toàn mới: **Tạo phòng mới**.

---

## F. Khi có sự cố

| Sự cố | Xử lý |
|---|---|
| **Wi-Fi lớp chập chờn** | Không cần làm gì. Điện thoại giữ nguyên màn hình, hiện "Đang kết nối lại" và tự bắt lại. Điểm đã ghi nhận không mất |
| **Mạng lớp hỏng hẳn** | Xem mục G — phương án dự phòng không cần mạng |
| **Tab điều khiển bị đóng / tải lại** | Mở lại `/host`. Phòng đang chạy được nhớ sẵn, bảng điều khiển quay lại đúng chỗ |
| **Màn chiếu bị đơ** | Tải lại tab `/room/<MÃ>`. Nó không giữ trạng thái riêng, vẽ lại từ máy chủ |
| **Một sinh viên kêu mất kết nối** | Bảo họ tải lại trang. Cookie đưa họ về đúng chỗ, giữ nguyên điểm |
| **Sinh viên báo trùng tên** | Màn hình của họ đã hiện sẵn một tên thay thế, chạm một lần là xong |
| **Trót bấm Công bố đáp án quá sớm** | Không quay lại được. Nói "câu này tính như đã xong", bấm **Câu tiếp theo**. Ai chưa kịp trả lời thì câu đó 0 điểm |
| **Hết giờ của buổi học** | Bấm **Kết thúc sớm** ở bất cứ câu nào. Bảng Top 5 vẫn hiện bình thường với các câu đã chơi |
| **Đăng nhập điều khiển báo lỗi cấu hình** | Biến môi trường `ADMIN_SECRET` / `SESSION_SECRET` chưa được đặt trên Vercel. Không sửa kịp tại lớp — dùng mục G |

## G. Phương án dự phòng khi mất mạng

Chuẩn bị trước, dùng khi lớp không có Internet.

**Dự phòng 1 — phát sóng từ điện thoại giảng viên.** Bật điểm phát sóng cá nhân, cho
khoảng 10 sinh viên đại diện kết nối, chơi theo nhóm thay vì cá nhân. Vẫn đủ vui và vẫn
tính điểm thật.

**Dự phòng 2 — chạy trên máy cục bộ, dùng Wi-Fi phòng học không có Internet.** Nếu phòng
có bộ phát Wi-Fi nội bộ (dù không ra Internet):

```bash
npm run build
npm start -- -H 0.0.0.0        # rồi mở http://<IP-máy-bạn>:3000/host
```

Mã QR tự sinh theo địa chỉ máy bạn, nên sinh viên trong cùng mạng vẫn quét được. Chế độ
bộ nhớ tạm là đủ cho một ván trên một máy. Nhớ tìm IP bằng `ipconfig` và mở cổng 3000 trên
tường lửa **trước** buổi học.

**Dự phòng 3 — bản giấy, không cần máy móc.** In [`question-set.md`](./question-set.md).
Đọc từng câu, cho lớp giơ tay theo A/B/C/D, đếm nhanh, rồi công bố đáp án và giải thích.
Mất phần xếp hạng nhưng giữ trọn phần nội dung — và phần nội dung mới là thứ được chấm
điểm thuyết trình. **Hãy in sẵn trước buổi học.**

---

## H. Danh sách kiểm tra cuối cùng trước giờ lên lớp

- [ ] Đăng nhập được `/host` trên chính máy sẽ dùng
- [ ] Đã chạy thử trọn một ván từ đầu đến cuối
- [ ] Đã in bản giấy bộ câu hỏi (dự phòng 3)
- [ ] Đã chọn trước 1–2 câu sẽ dừng lại phân tích
- [ ] Cáp máy chiếu / chuyển đổi cổng đã thử
- [ ] Máy tính xách tay đã sạc, đã tắt thông báo và chế độ ngủ
- [ ] Biết mật khẩu Wi-Fi lớp, và có sẵn điểm phát sóng cá nhân làm dự phòng
- [ ] Tab `/host` **không** được chiếu lên màn hình lớn
