# ĐẠO ĐỨC 360 — Kế hoạch triển khai

Tài liệu kỹ thuật của minigame lớp học cho **Chủ đề 8, môn HCM202 — Tư tưởng Hồ Chí Minh
về đạo đức và những nguyên tắc xây dựng đạo đức cách mạng**.

Nội dung học thuật và xuất xứ từng khái niệm nằm ở [`content-source.md`](./content-source.md).
Bộ câu hỏi và lý do thiết kế nằm ở [`question-set.md`](./question-set.md).
Quy trình chạy trên lớp nằm ở [`classroom-runbook.md`](./classroom-runbook.md).

---

## 1. Ý tưởng trò chơi

Không phải một bản sao Kahoot. Mỗi câu là **một tình huống có thật trong đời sinh viên**
(bài tập nhóm, hạn nộp, quỹ lớp, nhận lỗi, chia việc). Người chơi chọn một hành động; sau
đó trò chơi chỉ ra **chuẩn mực** hoặc **nguyên tắc** nào của Chủ đề 8 đứng sau lựa chọn đó.

Khẩu hiệu: *Một quyết định. Một giá trị. Hai mươi giây.*

## 2. Thời lượng mục tiêu

| Hạng mục | Thời gian |
|---|---|
| Sinh viên quét QR và nhập tên | ~45 giây (song song, trong lúc giảng viên nói) |
| 7 câu hỏi × 20–28 giây trả lời | 160 giây |
| 7 lần công bố đáp án, do giảng viên bấm | ~15 giây/câu nếu giảng viên bình luận ngắn |
| Màn hình Top 5 | ~30 giây |
| **Tổng** | **~4–5 phút** |

Tổng thời gian trả lời được khoá cứng ở mức ≤ 170 giây. Phần công bố đáp án **do người
điều khiển bấm**, không tự chạy: giảng viên cần quyền dừng lại bình luận một câu hay lướt
nhanh một câu khác, và đó là biến số duy nhất thực sự quyết định tổng thời lượng.

## 3. Vòng đời trò chơi

```
LOBBY ──START──► QUESTION_OPEN ──REVEAL (hoặc hết giờ)──► QUESTION_REVEAL
                       ▲                                        │
                       └──────────────NEXT──────────────────────┤
                                                                │
                                               NEXT ở câu cuối   ▼
                                                           FINISHED
                                                                │
                                                     RESET ◄─────┘
                                                        │
                                                        ▼
                                                      LOBBY
```

Bốn trạng thái, cộng một cờ `joinLocked` riêng. Cờ khoá cửa vào **không** được làm thành
trạng thái thứ năm vì nó trực giao với vòng đời: giảng viên có thể khoá phòng khi đang ở
sảnh chờ mà không làm thay đổi bước tiếp theo của trò chơi.

**Hết giờ được xử lý theo kiểu lười (lazy).** Không có tiến trình nền nào đếm ngược. Mỗi
lần có client đọc trạng thái, máy chủ kiểm tra `now > answersCloseAt` và nếu đúng thì
chuyển sang `QUESTION_REVEAL` ngay trong lượt đọc đó. Lý do: Vercel không có scheduler,
và cách này còn giúp trò chơi vẫn tiến đúng khi trình duyệt của giảng viên bị đóng giữa
chừng. Ghi bằng compare-and-set trên `version` nên nhiều client cùng poll không thể áp
dụng chuyển trạng thái hai lần.

## 4. Trải nghiệm người chơi — `/join/[code]`

Mobile-first, một cột, không cần tài khoản.

```
Quét QR ─► Nhập tên ─► Sảnh chờ ─► Câu hỏi (4 phương án + đồng hồ)
       ─► "Đã ghi nhận" ─► Công bố đáp án + giải thích + hạng
       ─► câu tiếp theo … ─► Kết quả cuối + Top 5
```

Các tình huống bất thường đã xử lý:

| Tình huống | Hành vi |
|---|---|
| Tải lại trang giữa trận | Cookie đã ký được đọc lại, quay đúng về màn hình hiện tại, giữ nguyên điểm |
| Mất mạng tạm thời | Giữ nguyên màn hình cuối, hiện dải "Đang kết nối lại", tự poll lại, giãn dần |
| Khoá màn hình rồi mở lại | `visibilitychange` kích hoạt poll ngay, không chờ hết chu kỳ |
| Chạm hai lần vào phương án | Lần thứ hai bị chặn ở client, và nếu vẫn tới nơi thì bị ràng buộc UNIQUE của CSDL chặn |
| Trùng tên | Từ chối, kèm gợi ý một tên còn trống để chạm một lần là xong |
| Vào muộn sau khi đã bắt đầu | Từ chối rõ ràng bằng tiếng Việt |

## 5. Trải nghiệm người điều khiển — `/host`

Đăng nhập bằng mã quản trị, đổi lấy cookie `httpOnly`. Bảng điều khiển luôn có **đúng một
hành động chính** nổi bật ở mỗi thời điểm, vì giảng viên vừa bấm vừa nói trước lớp.

Chức năng: tạo phòng · xem mã và link · mở màn chiếu · khoá/mở cửa vào · bắt đầu · công bố
đáp án · sang câu tiếp · kết thúc sớm · chơi lại · tạo phòng mới. Màn hình điều khiển hiển
thị đáp án đúng và phân bố lựa chọn ngay khi câu đang mở, để giảng viên chuẩn bị lời bình.

Mã phòng đang chạy được lưu ở `localStorage`, nên giảng viên lỡ tải lại hoặc đóng nhầm tab
vẫn quay lại đúng phòng.

## 6. Trải nghiệm màn chiếu — `/room/[code]`

Tối ưu cho 16:9, chữ cỡ lớn, đọc được từ cuối phòng.

- **Sảnh chờ**: tên trò chơi cỡ lớn, mã QR dựng sẵn phía máy chủ, mã phòng, số người, tên vừa vào.
- **Đang hỏi**: số câu, đề bài, bốn phương án, đồng hồ đếm ngược kèm thanh tiến độ, số lượt đã trả lời.
- **Công bố**: đáp án đúng, giải thích ngắn, phân bố phần trăm từng phương án, top dẫn đầu.
- **Kết thúc**: bục Top 5 (ba cột, cột giữa cao nhất), kèm thống kê lớp.

Mã QR được sinh **phía máy chủ thành SVG nội tuyến**, nên nó hiện ngay ở lần vẽ đầu tiên —
đúng 30 giây cả lớp đang giơ điện thoại lên là lúc không được phép có spinner.

## 7. Tính điểm

```
đúng   : 700 điểm + thưởng tốc độ
sai    : 0 điểm
thưởng : round(300 × (1 − elapsed/duration)), kẹp trong [0, 300]
```

Kiến thức luôn thắng tốc độ: câu đúng chậm nhất (700) vẫn hơn câu sai nhanh nhất (0), và
câu đúng nhanh nhất (1000) chưa tới 1,5 lần câu đúng chậm nhất. Đây là điều kiện đã được
kiểm thử tự động, không phải chỉ là ý định thiết kế.

`elapsed` được đo **phía máy chủ**, bằng hiệu giữa thời điểm yêu cầu tới nơi và
`question_started_at` đã lưu. Trình duyệt không gửi lên bất kỳ mốc thời gian nào.

**Cửa sổ ân hạn 1 giây.** Câu trả lời tới trong vòng 1 giây sau khi đồng hồ về 0 vẫn được
nhận, nhưng **không có điểm thưởng tốc độ**. Lý do: đồng hồ mà sinh viên nhìn thấy chạy ở
client, còn việc chấp nhận lại do thời điểm tới máy chủ quyết định; không có ân hạn thì
người chạm ở giây 19,9 trên mạng 3G bị phạt vì độ trễ đường truyền chứ không phải vì kiến
thức. Ân hạn không thể bị lợi dụng, vì điểm thưởng đã bằng 0 từ mốc hết giờ.

## 8. Kiến trúc

```
Trình duyệt (điện thoại / màn chiếu / máy giảng viên)
   │  poll JSON có gắn ?v=<version>
   ▼
Next.js App Router — Route Handlers   ◄── nơi duy nhất giữ bí mật
   │
   ▼
GameEngine  (toàn bộ luật chơi, thuần, có kiểm thử)
   │
   ▼
GameStore  (giao diện)
   ├── MemoryGameStore    — phát triển / dự phòng, một tiến trình
   └── SupabaseGameStore  — Postgres, dùng service-role key phía máy chủ
```

Luật chơi nằm **trên** tầng lưu trữ, nên hai adapter không thể trôi lệch nhau về hành vi.
Ba thao tác bắt buộc phải nguyên tử — vào phòng, trả lời, chuyển trạng thái — được đẩy
xuống hàm SQL thay vì ghép từ nhiều lượt gọi ở tầng ứng dụng.

## 9. Mô hình realtime

**Poll có gắn phiên bản, không dùng WebSocket.**

Quyết định này là có chủ ý. Khi client đã nhận được câu hỏi kèm mốc `questionEndsAt` đáng
tin, nó **tự chạy đồng hồ của mình**; việc duy nhất mà một lượt poll cần bắt được là thời
điểm chuyển trạng thái. Chậm một giây ở chỗ đó là không thể nhận ra trong một phòng học;
còn một socket rớt là một sinh viên ngồi nhìn màn hình đứng hình.

- Client gửi kèm `?v=<version đang giữ>`.
- Không đổi → **204, không thân phản hồi**. Rẻ đến mức 80 điện thoại poll mỗi giây vẫn nhẹ.
- Có đổi → 200 kèm toàn bộ khung nhìn.
- Nhịp poll: 700 ms khi đang có câu hỏi, 1500 ms khi nhàn rỗi, giãn theo cấp số nhân khi lỗi.

`version` được tăng sau **mọi** thay đổi có ý nghĩa, kể cả khi có thêm một câu trả lời.
Nhịp tim của người chơi cố ý **không** tăng `version`, nếu không mỗi lần một sinh viên
poll sẽ đánh thức toàn bộ phần còn lại của lớp.

*Vì sao không dùng Supabase Realtime?* Tất cả các bảng đều bật RLS mà **không có policy
nào**, nên trình duyệt không đọc được gì trực tiếp — đây chính là thứ ngăn một sinh viên
đọc `answers.is_correct` khi câu hỏi còn đang mở. Nếu sau này muốn giảm độ trễ chuyển
trạng thái, cách đúng là **Realtime Broadcast** phát đi *chỉ mỗi con số `version`*, rồi
client gọi lại route của máy chủ; kênh broadcast không để lộ dữ liệu bảng. Poll vẫn phải
là đường cơ sở trong mọi trường hợp.

## 10. Mô hình dữ liệu

Xem [`../supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).

| Bảng | Vai trò | Ràng buộc đáng chú ý |
|---|---|---|
| `rooms` | Trạng thái có thẩm quyền của một phòng | `code` UNIQUE, khớp regex 5 chữ cái; state nằm trong 4 giá trị; phòng đang mở câu hỏi bắt buộc phải có đủ ba mốc thời gian |
| `players` | Người chơi thuộc đúng một phòng | **UNIQUE (room_id, name_key)**; `score >= 0`; độ dài tên 1–24 |
| `answers` | Một câu trả lời đã chấm | **UNIQUE (player_id, question_index)** — ràng buộc quan trọng nhất của lược đồ; `choice_index` trong 0–3; `points >= 0` |

Hàm SQL:

- `hcm360_score(...)` — phản chiếu đúng `src/lib/game/scoring.ts`. **Hai nơi phải sửa cùng nhau.**
- `submit_answer(...)` — khoá dòng phòng, kiểm tra cửa sổ thời gian, đo `elapsed` bằng đồng hồ CSDL, chấm điểm, chèn câu trả lời, cộng điểm, tăng `version` — tất cả trong một giao dịch.
- `join_room(...)` — kiểm tra sức chứa và trùng tên trong cùng một giao dịch, nên hai lượt vào đồng thời không thể cùng lọt.
- `apply_room_transition(...)` — compare-and-set trên `version`, để hai tab của giảng viên cùng bấm "câu tiếp" chỉ làm trò chơi tiến **một** bước.

Số thứ tự câu trả lời đúng (`correctIndex`) **không nằm trong cơ sở dữ liệu**. Nó do máy
chủ Next.js đọc từ bộ câu hỏi TypeScript rồi truyền vào hàm SQL. Nội dung học thuật vì thế
có đúng một nguồn duy nhất, đi kèm lịch sử Git.

## 11. Mô hình bảo mật

| Mối đe doạ | Biện pháp |
|---|---|
| Sinh viên tự gửi điểm | Thân yêu cầu chỉ có `questionIndex` và `choiceIndex`. Không có trường điểm, thời gian hay id người chơi. Đã kiểm chứng bằng cách gửi kèm `points: 999999` — bị bỏ qua |
| Sinh viên trả lời hai lần | Ràng buộc UNIQUE của CSDL, không phải logic ứng dụng |
| Sinh viên trả lời sau giờ | Máy chủ so `now` với `answers_close_at` đã lưu, bên trong giao dịch có khoá dòng |
| Sinh viên đọc trộm đáp án | Khung nhìn khi câu đang mở **không chứa** `correctIndex`, `explanation` hay `distractorRationale`. Đã kiểm chứng trên phản hồi thật |
| Sinh viên đọc thẳng CSDL | RLS bật, **không policy nào**. Vai trò `anon` không đọc được gì |
| Lộ service-role key | Chỉ dùng phía máy chủ. `src/lib/env.ts` khai báo `server-only`, nên nhập nó từ Client Component là lỗi biên dịch. Không đọc từ bất kỳ tên `NEXT_PUBLIC_` nào |
| Production âm thầm chạy bằng bộ nhớ tạm | `productionConfigError()` từ chối đăng nhập điều khiển **và** tạo phòng khi thiếu Supabase ở production. Kiểm tra ở cả hai điểm, vì cookie cấp trước đó vẫn còn hiệu lực |
| Lộ tên tệp/số dòng nội bộ | `provenance` bị loại khỏi payload gửi cho người chơi và màn chiếu (`RevealedQuestion` so với `HostRevealedQuestion`), không chỉ là không hiển thị |
| Đoán mã quản trị | So sánh theo thời gian hằng định; giới hạn tần suất 10 lần rồi hồi 1 lần/10 giây; production từ chối chạy nếu còn dùng mã mặc định của môi trường dev |
| Đánh cắp phiên | Cookie `httpOnly` + `sameSite=lax` + `secure` ở production; token ký HMAC-SHA256; token người chơi gắn chặt với mã phòng nên không dùng lại được sang phòng khác |
| Giả mạo tên | Ký tự vô hình và ký tự đảo chiều bị loại khỏi tên hiển thị |
| Cache làm đông màn hình | Mọi phản hồi API đều gắn `no-store` |

Rủi ro còn lại đã ghi nhận: giới hạn tần suất nằm trong bộ nhớ tiến trình nên **theo từng
instance**, không phân tán. Nó làm chậm chứ không chặn tuyệt đối một script; tuyến phòng
thủ thật cho quyền điều khiển vẫn là một `ADMIN_SECRET` đủ dài.

## 12. Hành vi kết nối lại

Người chơi giữ một cookie đã ký, gắn với mã phòng, sống 12 giờ. Khi tải lại trang, client
hỏi máy chủ xem cookie đó còn ứng với một người chơi hay không **trước khi** hiện ô nhập
tên — nên tải lại giữa trận là quay thẳng về đúng câu hỏi, không phải vào lại.

Nếu cookie sống lâu hơn người chơi (phòng đã reset, hoặc tiến trình bộ nhớ tạm đã khởi
động lại), route vào phòng sẽ lặng lẽ cho đăng ký lại như người mới thay vì báo lỗi.

## 13. Chiến lược kiểm thử

Kiểm thử đơn vị (Vitest, môi trường Node) tập trung vào phần dễ sai và tốn kém nếu sai:

- `scoring` — biên, kẹp giá trị, đơn điệu, không bao giờ ra số lẻ hay vượt trần
- `state-machine` — mọi chuyển trạng thái hợp lệ và mọi chuyển trạng thái bị từ chối, biên của cửa sổ ân hạn
- `leaderboard` — thứ tự, hoà điểm, xếp hạng kiểu thi đấu (1, 2, 2, 4), chọn Top 5, tính tất định
- `engine` — vào phòng, trùng tên, trả lời hai lần, trả lời muộn, che giấu thông tin, hết giờ kiểu lười, trọn một ván

Kiểm thử thủ công qua HTTP trên bản dựng production đã thực hiện cho: xác thực người điều
khiển, che giấu đáp án, chống gửi điểm giả, chống trả lời hai lần, chống trả lời muộn,
poll 204, reset, kết nối lại. Kết quả ghi trong báo cáo cuối.

## 14. Chiến lược triển khai

Vercel + Supabase. Các bước chính xác nằm trong [`../README.md`](../README.md).

Nguyên tắc: **production bắt buộc phải có Supabase, và ứng dụng tự chặn nếu thiếu.**
Adapter bộ nhớ chỉ đúng cho một tiến trình; một deployment serverless chạy nhiều instance,
mỗi instance sẽ giữ một bản sao phòng riêng và lớp sẽ bị tách thành nhiều ván rời rạc.

Vì vậy hành vi ở production là **fail closed**, không phải suy giảm âm thầm:

| Tình huống | Hành vi |
|---|---|
| Thiếu `SUPABASE_URL` hoặc `SUPABASE_SERVICE_ROLE_KEY` | Đăng nhập điều khiển và tạo phòng bị từ chối (`SUPABASE_NOT_CONFIGURED`) |
| Còn dùng `ADMIN_SECRET` / `SESSION_SECRET` mặc định của dev | Từ chối, ghi log mã lỗi cụ thể |
| `SESSION_SECRET` ngắn hơn 32 ký tự | Từ chối |

Kiểm tra ở **cả** `/api/host/login` **và** `/api/host/rooms`: một cookie điều khiển cấp
trước khi deployment mất cơ sở dữ liệu vẫn còn hiệu lực, nên chỉ chặn ở bước đăng nhập là
chưa đủ. Phản hồi trả về thông báo chung; mã lỗi cụ thể chỉ vào log máy chủ. Toàn bộ các
trường hợp này có kiểm thử trong `tests/env.test.ts`.

### Địa chỉ công khai và mã QR

Suy ra từ chính yêu cầu, không cần biến môi trường trên Vercel: nền tảng luôn đặt
`x-forwarded-host` và `x-forwarded-proto`. Quy tắc nằm ở `src/lib/origin.ts` và được kiểm
thử riêng, vì một mã QR sai giao thức chỉ lộ ra đúng lúc cả lớp đang giơ điện thoại lên.

Thứ tự ưu tiên: `NEXT_PUBLIC_APP_ORIGIN` (nếu được đặt) → header của proxy → host trực
tiếp, với giao thức suy ra theo địa chỉ (`http` cho loopback và dải LAN riêng, `https` cho
địa chỉ công khai). Nhánh cuối chính là thứ làm cho mã QR quét được khi chạy `next dev`
trên địa chỉ LAN của máy tính xách tay.
