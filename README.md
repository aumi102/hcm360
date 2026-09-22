# ĐẠO ĐỨC 360° — Bạn sẽ chọn gì?

Minigame lớp học nhiều người chơi, dùng ở cuối buổi thuyết trình **Chủ đề 8, môn HCM202
(Tư tưởng Hồ Chí Minh)** — *Tư tưởng Hồ Chí Minh về đạo đức và những nguyên tắc xây dựng
đạo đức cách mạng*.

Màn chiếu hiện mã QR → sinh viên quét bằng điện thoại → nhập tên → giảng viên bấm bắt đầu
→ 7 câu hỏi tình huống → chấm điểm theo độ đúng và tốc độ → bục Top 5. Trọn vẹn trong
khoảng 5 phút.

Không phải bản sao Kahoot. Mỗi câu là một tình huống có thật trong đời sinh viên; sau khi
chọn, trò chơi chỉ ra chuẩn mực hoặc nguyên tắc nào của Chủ đề 8 đứng sau lựa chọn đó.
**Mọi luận điểm học thuật đều truy được về tài liệu môn học của lớp**, ghi trong
[`docs/content-source.md`](docs/content-source.md).

---

## Ảnh màn hình

Chưa kèm ảnh trong repo. Cách tự chụp sau khi chạy (mục [Chạy tại máy](#chạy-tại-máy)):

| Màn hình | Địa chỉ | Ghi chú khi chụp |
|---|---|---|
| Trang chủ | `/` | |
| Sảnh chờ trên màn chiếu | `/room/<MÃ>` | Đặt cửa sổ 1920×1080 rồi chụp |
| Câu hỏi trên màn chiếu | `/room/<MÃ>` | Chụp khi đồng hồ còn khoảng 10 giây |
| Bục Top 5 | `/room/<MÃ>` | Cần ít nhất 3 người chơi mới đủ đẹp |
| Điện thoại | `/join/<MÃ>` | Dùng chế độ giả lập thiết bị, khổ iPhone 14 |
| Bảng điều khiển | `/host` | |

## Yêu cầu môi trường

- **Node.js 20.9+** (đã phát triển và kiểm thử trên 22.x)
- **npm 10+**
- Một dự án **Supabase** — chỉ cần khi chạy production; xem [Chế độ demo](#chế-độ-demo-không-cần-supabase)

## Chạy tại máy

```bash
npm install
npm run dev
```

Mở http://localhost:3000.

Chạy được ngay trên bản sao vừa clone, **không cần biến môi trường nào**: ứng dụng tự
chuyển sang adapter bộ nhớ và dùng mã quản trị mặc định `hcm360-dev`.

Chạy thử trọn một ván:

1. Mở http://localhost:3000/host, nhập `hcm360-dev`, bấm **Tạo phòng**.
2. Bấm **Mở màn chiếu ↗**.
3. Mở `/join/<MÃ>` ở một cửa sổ ẩn danh (hoặc quét QR bằng điện thoại cùng Wi-Fi), nhập tên.
4. Quay lại tab điều khiển, bấm **Bắt đầu**.

> Muốn quét QR bằng điện thoại thật khi chạy `npm run dev`: mã QR được dựng theo host của
> yêu cầu, nên hãy mở bằng địa chỉ LAN của máy (`http://192.168.x.x:3000`) chứ không phải
> `localhost`, rồi điện thoại vào cùng Wi-Fi.

## Biến môi trường

Chép [`.env.example`](.env.example) thành `.env.local` rồi điền. `.env.local` đã bị Git bỏ qua.

| Biến | Bắt buộc | Mục đích |
|---|---|---|
| `ADMIN_SECRET` | production | Mật khẩu người điều khiển nhập ở `/host` |
| `SESSION_SECRET` | production | Khoá ký cookie phiên (HMAC-SHA256), tối thiểu 32 ký tự |
| `SUPABASE_URL` | production | URL dự án Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | production | Khoá service-role. **Chỉ phía máy chủ** |
| `NEXT_PUBLIC_APP_ORIGIN` | không | Ép địa chỉ tuyệt đối dùng cho mã QR. **Không cần trên Vercel** — ứng dụng tự suy ra từ `x-forwarded-host` / `x-forwarded-proto` |
| `DEV_ALLOWED_ORIGINS` | không | Chỉ dành cho `next dev`: các địa chỉ LAN được phép, phân tách bằng dấu phẩy. Không ảnh hưởng bản production |

Sinh khoá:

```bash
openssl rand -base64 24   # ADMIN_SECRET
openssl rand -base64 48   # SESSION_SECRET
```

> **Bảo mật.** Ngoài `NEXT_PUBLIC_APP_ORIGIN`, không biến nào trong danh sách này được
> phép mang tiền tố `NEXT_PUBLIC_`. Tiền tố đó nhúng thẳng giá trị vào gói JavaScript gửi
> xuống trình duyệt, nơi mọi sinh viên trong phòng đều đọc được.
>
> Ở môi trường production, ứng dụng **từ chối đăng nhập người điều khiển** nếu phát hiện
> vẫn đang dùng khoá mặc định của môi trường dev, hoặc khoá quá ngắn.

## Chế độ demo (không cần Supabase)

Nếu để trống `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`, ứng dụng chạy trên
`MemoryGameStore`: toàn bộ trò chơi hoạt động, nhưng dữ liệu nằm trong bộ nhớ của một tiến
trình máy chủ và mất khi khởi động lại.

Đúng cho: phát triển, chạy thử, trình diễn trên một máy, và phương án dự phòng khi lớp mất
Internet.

**Không thể dùng cho production — và ứng dụng tự chặn.** Một deployment serverless chạy
nhiều instance; mỗi instance sẽ giữ một bản sao phòng riêng và lớp bị tách thành nhiều ván
rời rạc. Vì vậy khi `NODE_ENV=production` mà thiếu Supabase (hoặc còn dùng mã bí mật mặc
định của môi trường dev), thao tác **đăng nhập điều khiển và tạo phòng bị từ chối** kèm
thông báo rõ ràng, thay vì âm thầm chạy bằng bộ nhớ tạm. Xem `productionConfigError()`
trong `src/lib/env.ts` và bộ kiểm thử `tests/env.test.ts`.

## Cài đặt Supabase

1. Tạo dự án mới tại [supabase.com](https://supabase.com) (gói miễn phí là đủ).
2. Mở **SQL Editor**, dán toàn bộ nội dung
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) rồi chạy.
   Tệp này idempotent, chạy lại nhiều lần vẫn an toàn.
3. Vào **Project Settings → API**, lấy:
   - **Project URL** → `SUPABASE_URL`
   - khoá **`service_role`** (không phải `anon`) → `SUPABASE_SERVICE_ROLE_KEY`
4. Kiểm tra lại: ở **Table Editor**, ba bảng `rooms`, `players`, `answers` phải hiện nhãn
   **RLS enabled** và **không có policy nào**. Đó là trạng thái đúng — trình duyệt không
   bao giờ nói chuyện trực tiếp với các bảng này.

Bản migration tạo: ba bảng kèm ràng buộc, bốn hàm SQL (`hcm360_score`, `submit_answer`,
`join_room`, `apply_room_transition`), bật RLS, và thu hồi quyền `execute` của `anon`.

### Dữ liệu mẫu

Không cần, và cố ý như vậy. Bộ câu hỏi nằm trong TypeScript
([`src/lib/content/topic8.ts`](src/lib/content/topic8.ts)) chứ không nằm trong cơ sở dữ
liệu, nên nội dung học thuật có đúng một nguồn duy nhất và đi kèm lịch sử Git. Phòng được
tạo lúc chạy, không cần seed.

### Dọn dẹp giữa các kỳ

```sql
select public.prune_old_rooms(interval '12 hours');
```

## Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `npm run dev` | Máy chủ phát triển |
| `npm run build` | Bản dựng production |
| `npm start` | Chạy bản dựng production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Chạy toàn bộ kiểm thử một lượt |
| `npm run test:watch` | Kiểm thử ở chế độ theo dõi |
| `npm run smoke` | Chạy thử trọn một ván qua HTTP trên máy chủ dev thật |
| `npm run verify` | lint + typecheck + test |
| `npm run predeploy` | **Cổng phát hành**: lint + typecheck + test + build + smoke. Thoát khác 0 nếu có lỗi |

## Kiểm thử

```bash
npm test
```

Vitest, môi trường Node, không cần cơ sở dữ liệu. Phạm vi tập trung vào phần sai thì tốn
kém: tính điểm và các giá trị biên, chuyển trạng thái phòng, chặn trả lời hai lần, chặn
trả lời muộn, che giấu đáp án, thứ tự và hoà điểm trên bảng xếp hạng, chọn Top 5, và trọn
một ván chạy qua `GameEngine`.

## Triển khai lên Vercel

Các bước chính xác, kèm bảng biến môi trường và danh sách kiểm tra sau khi lên production,
nằm ở [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Tóm tắt:

1. Tạo dự án Supabase, chạy `supabase/migrations/0001_init.sql`.
2. Import repo vào Vercel (tự nhận diện Next.js, giữ nguyên mặc định).
3. Thêm bốn biến môi trường: `ADMIN_SECRET`, `SESSION_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Bấm **Deploy**.
5. Chạy danh sách kiểm tra production ở [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) mục C.

`NEXT_PUBLIC_APP_ORIGIN` **không cần** trên Vercel: mã QR được dựng từ `x-forwarded-host`
và `x-forwarded-proto` mà nền tảng luôn đặt sẵn.

> Không cần thêm cấu hình build, không cần `vercel.json`, không cần vùng chạy đặc biệt.

## Chạy trên lớp

Xem [`docs/classroom-runbook.md`](docs/classroom-runbook.md) — quy trình từng bước, cách
xử lý sự cố, và ba phương án dự phòng khi mất mạng. In sẵn trước buổi dạy.

## Tài liệu

| Tệp | Nội dung |
|---|---|
| [`docs/content-source.md`](docs/content-source.md) | Bản đồ nội dung Chủ đề 8, xuất xứ từng khái niệm, sổ ghi những chỗ tài liệu gốc không thống nhất |
| [`docs/final-content-audit.md`](docs/final-content-audit.md) | Kiểm duyệt phạm vi học thuật trước phát hành: phân loại A/B/C/D từng phần tử của từng câu |
| [`docs/question-set.md`](docs/question-set.md) | 7 câu hỏi, lý do thiết kế, vì sao từng phương án sai là sai. **In trang này mang lên lớp** |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Kiến trúc, mô hình realtime, lược đồ dữ liệu, mô hình bảo mật, chiến lược kiểm thử |
| [`docs/classroom-runbook.md`](docs/classroom-runbook.md) | Quy trình chạy thực tế trên lớp và ba phương án dự phòng |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Supabase + Vercel từng bước, bảng biến môi trường, kiểm tra sau triển khai |
| [`docs/RELEASE-CANDIDATE.md`](docs/RELEASE-CANDIDATE.md) | Trạng thái bản phát hành ứng viên |

## Công nghệ

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zod 4 ·
Supabase Postgres · Vitest · `qrcode`

## Ghi chú học thuật

Nội dung được trích và đối chiếu từ tài liệu môn học HCM202 của lớp, **không** lấy từ trí
nhớ hay từ giáo trình bên ngoài. Những chỗ các tài liệu gốc dùng thuật ngữ khác nhau —
đáng chú ý nhất là *"biện pháp"* so với *"nguyên tắc"* xây dựng đạo đức mới, và việc ngân
hàng trắc nghiệm ngụ ý **bốn** nguyên tắc trong khi tài liệu lý thuyết chỉ nêu **ba** — đã
được ghi nhận rõ ràng thay vì gộp lại cho êm. Xem sổ ghi bất đồng trong
[`docs/content-source.md`](docs/content-source.md).
