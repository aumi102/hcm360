> **Trạng thái hiện tại: ĐẠT.** Bản khảo sát dưới đây là **bản gốc**, ghi lại kết luận KHÔNG ĐẠT của lượt kiểm duyệt đầu tiên và lý do cụ thể. Ba sửa đổi bắt buộc ở §6 **đã được áp dụng**, và câu q4 đã được **một lượt kiểm độc lập khác** thẩm định lại từ đầu. Xem §8 ở cuối tài liệu. Bản gốc được giữ nguyên để còn dấu vết vì sao một câu từng bị chặn.

---

# Kiểm duyệt nội dung trước phát hành — ĐẠO ĐỨC 360

**Môn học:** HCM202 — FPT University
**Chủ đề 8:** Tư tưởng Hồ Chí Minh về đạo đức và những nguyên tắc xây dựng đạo đức cách mạng
**Đối tượng kiểm duyệt:** `src/lib/content/topic8.ts` (7 câu hỏi)
**Ngày kiểm:** 2026-09-22
**Kết luận của lượt đầu (đã được thay thế, xem §8):** KHÔNG ĐẠT — 1/7 câu còn lỗi phải sửa trước khi phát hành (xem §6).

---

## 1. Phương pháp và quy tắc phát hành

### 1.1 Phương pháp

Tài liệu môn học đặt tại thư mục trích xuất là **nguồn chân lý duy nhất**. Không dùng nguồn web, không dùng trí nhớ về tư tưởng Hồ Chí Minh. Khi tài liệu diễn đạt khác với cách hiểu thông thường, **theo tài liệu**.

Quy trình áp dụng cho từng câu:

1. Đọc trọn đối tượng câu hỏi trong `topic8.ts`, gồm cả hai trường nội bộ `provenance` và `distractorRationale`.
2. **Mở lại từng số dòng** mà chuỗi `provenance` viện dẫn bằng `sed -n` / `grep -n` — không tin chuỗi provenance, phải tự đối chiếu ký tự.
3. Kiểm chứng cả **khẳng định phủ định** (ví dụ "cụm từ X không có trong tài liệu") bằng `grep` trên toàn bộ năm tệp trích xuất.
4. Phân loại **từng phần tử** của câu hỏi (title, prompt, 4 phương án, explanation, conceptLabel, provenance) theo bảng A/B/C/D dưới đây, và đánh dấu phần tử nào **được chấm điểm** (tức là sinh viên phải chấp nhận nội dung đó thì mới ghi được điểm).
5. Đối chiếu với sổ ghi bất đồng ở `docs/content-source.md`.
6. Các câu có rủi ro cao được kiểm chéo độc lập bởi lượt thứ hai (q2, q4, q6).

### 1.2 Bốn mức phân loại

| Mức | Tên | Định nghĩa |
|---|---|---|
| **A** | SOURCE-EXPLICIT | Nội dung có nguyên văn trong tài liệu được cấp, hoặc là phép đếm/đối chiếu trực tiếp trên văn bản. Kiểm chứng được bằng một số dòng cụ thể. |
| **B** | SOURCE-DERIVED | Tình huống hư cấu, tên nhân vật, bối cảnh sinh viên — chỉ làm khung truyện cho một khái niệm đã được dạy tường minh. Không chứa khẳng định giáo lý mới. |
| **C** | AMBIGUOUS | Nội dung chạm vào một điểm mơ hồ đã biết của bộ tài liệu (tên gọi, số lượng, vị trí chương). |
| **D** | OUT-OF-SCOPE | Nội dung nghe như giáo trình nhưng **không có trong bất kỳ tài liệu nào được cấp** — giáo lý, trích dẫn, bối cảnh lịch sử hoặc thuật ngữ nhập từ bên ngoài. |

### 1.3 Quy tắc phát hành

ĐẠT khi và chỉ khi cả ba điều kiện sau đều thoả:

1. **Mọi sự kiện cần để chấm điểm đều là mức A.** Đáp án khoá đúng, và *lý do nó đúng*, phải nằm nguyên văn trong tài liệu.
2. **Không câu nào đòi kiến thức ngoài tài liệu.** Sinh viên chỉ đọc năm tệp được cấp là trả lời được.
3. **Không điểm phân biệt được chấm nào dựa trên một bất đồng chưa giải quyết.** Nếu điểm phân biệt có chạm bất đồng, bất đồng đó phải được tài liệu có thẩm quyền nhất giải quyết dứt khoát.

Hệ quả cứng: **bất kỳ phần tử mức D nào nằm trong nội dung được chấm điểm → KHÔNG ĐẠT.** Mức B chỉ hợp lệ khi thuần tuý là khung truyện; mức C chỉ hợp lệ khi không được chấm điểm hoặc đã được giải quyết.

---

## 2. Bảng tổng hợp theo câu

| Mã câu | Khái niệm | Đáp án khoá | Tệp nguồn | Mục/dòng | Phân loại | Cần kiến thức ngoài? | Kiểm tra mơ hồ | Xử lý |
|---|---|---|---|---|---|---|---|---|
| q1-pham-chat-voi-tu-minh | Bốn phẩm chất đạo đức cơ bản ứng với bốn mối quan hệ | B — "Cần, kiệm, liêm, chính - chí công vô tư" | decuong-lythuyet.md | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (463-464) > "Phẩm chất đạo đức cơ bản" (484); bốn mục 485/489/496/501; dòng chấm 489-490 | Toàn bộ phần chấm điểm mức **A**; không có phần tử B/C/D | Không | Chạm #2 (hai chương số 6 — đã ghi đủ tên chương), #4 (ngân hàng không đáp án — chỉ tham chiếu song song, không chấm trên đó). Không chạm tranh chấp biện pháp/nguyên tắc | **ĐẠT** — giữ nguyên |
| q2-ban-cam-ket-mot-thang | Tu dưỡng đạo đức suốt đời | C — "Minh coi tu dưỡng là việc nhất thời, không rèn luyện bền bỉ suốt đời" | decuong-lythuyet.md | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH > "Biện pháp xây dựng đạo đức mới" (506) > "1)- Tu dưỡng đạo đức suốt đời." (509); dòng chấm 510 | Phần chấm điểm mức **A**; tình huống mức **B** (khung truyện) | Không | Chạm #1 (đã khai PDF cùng văn bản), #3 (chỉ ở nhãn giải thích, nêu cả hai cách gọi), #4 (không viện dẫn ngân hàng), và đánh số chủ đề (dùng "Chủ đề 8" đúng lịch trình) | **ĐẠT** — giữ nguyên; ghi chú lệch dòng 521/522 trong provenance, không chặn phát hành |
| q3-ba-ke-dich | Ba kẻ địch phải thường xuyên chống lại | D — "Bọn đế quốc; thói quen và truyền thống lạc hậu; chủ nghĩa cá nhân" | decuong-lythuyet.md | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH > "3)- Xây đi đôi với chống." (516); dòng chấm 518 | Phần chấm điểm mức **A** (trích nguyên văn); nhiễu mức **A**/**B**, tính sai đều chứng minh bằng dòng A | Không | Chạm #2 (ghi đủ tên chương, phân biệt với CHƯƠNG 6 PHƯƠNG PHÁP ở 527-528), #4 (ngân hàng chỉ dùng để chỉ ra cụm từ xuất hiện ở đâu, có ghi rõ không có đáp án) | **ĐẠT** — giữ nguyên |
| q4-ban-nhan-loi-va-sua | Thương yêu con người, sống có tình có nghĩa | A — "Cho bạn tự sửa lại và chỉ rõ chỗ sai để cùng rút kinh nghiệm" | decuong-lythuyet.md | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH > "3)- Thương yêu con người, sống có tình có nghĩa" (496-500); dòng chấm 499, hỗ trợ 498/500/495 | **D trong nội dung được chấm** — phương án khoá và phần giải thích chứa nội dung không có trong tài liệu | Không (nhưng buộc sinh viên chấp nhận một mệnh đề ngoài tài liệu) | Chạm #3 gián tiếp: phần giải thích kéo "xây đi đôi với chống" (mục 506 ff.) vào một câu về phẩm chất, và "chỉ rõ chỗ sai" chính là **phê bình** — thứ mà `content-source.md` §3.4/§4 đã phán quyết là nguyên tắc tổ chức của Đảng ở Chương 4, không thuộc Chương 6 | **PHẢI SỬA** — 3 sửa đổi chuỗi, xem §6 |
| q5-ba-nguyen-tac | Biện pháp xây dựng đạo đức mới (mục này tài liệu không dùng chữ "nguyên tắc") | B — "Tự phê bình và phê bình" | decuong-lythuyet.md (nguồn phương án: tracnghiem.md) | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH > "Biện pháp xây dựng đạo đức mới" (506); ba mục 509/512/516, thân mục hết ở 521; bối cảnh "tự phê bình và phê bình" ở CHƯƠNG 4 dòng 314 | Toàn bộ phần chấm điểm mức **A** (phép đếm trên văn bản có ranh giới rõ) | Không | Chạm #2 **là điểm được chấm** — đã giải quyết dứt khoát bằng tài liệu lý thuyết + bản PDF (đánh số đều 1)/2)/3) rồi sang mục "III."); chạm #1 (tên gọi) nhưng **không chấm trên đó**: tiêu đề/đề bài/nhãn đều nêu cả hai chữ | **ĐẠT** — giữ nguyên |
| q6-quy-nhom-xung-dot-loi-ich | Cần, kiệm, liêm, chính - chí công vô tư | D — "Từ chối khoản chia lại, nói rõ quan hệ người thân, để nhóm tự quyết định" | decuong-lythuyet.md | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH > "Phẩm chất đạo đức cơ bản", phẩm chất 2) ở 489-495 (Kiệm 492, Liêm 493, Chính 494, chí công vô tư 495), phẩm chất 3) ở 496-498 | Phần chấm điểm mức **A** (ba định nghĩa nguyên văn); tình huống mức **B** | Không | Chạm #1 (đã khai PDF cùng văn bản), #4 (không dùng ngân hàng — đã grep xác nhận), hai chương số 6 (ghi đủ tên). Không chạm tranh chấp ba/bốn mục | **ĐẠT** — giữ nguyên; hai ghi chú minh bạch, không cần sửa |
| q7-xay-di-doi-voi-chong | Xây đi đôi với chống | C — "Chống cũng nhằm xây, đi liền với xây nhưng xây là nhiệm vụ chủ yếu và lâu dài" | decuong-lythuyet.md | CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH > "3)- Xây đi đôi với chống." (516); dòng chấm 521, hỗ trợ 518/520 | Toàn bộ phần chấm điểm mức **A**; tình huống mức **B** | Không | Không bất đồng nào chạm phần chấm điểm: câu hỏi không dùng chữ "nguyên tắc"/"biện pháp" ở phần sinh viên thấy, không đếm mục, không nhắc "tự phê bình và phê bình" | **ĐẠT** — giữ nguyên |

---

## 3. Chi tiết theo từng câu

### 3.1 q1-pham-chat-voi-tu-minh — **ĐẠT**

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | A | Không | "tự mình" là chữ của chính tài liệu, dòng 490. `grep` toàn tệp lý thuyết cho **đúng một** kết quả (dòng 490) |
| prompt | A | **Có** | Dòng 484 + bốn ngoặc đơn quan hệ ở 485/489/496/501; mệnh đề phân biệt là dòng 490 nguyên văn, giữ nguyên chính tả "hàng ngày" và dấu nháy cong quanh “tự mình” |
| optionA | A | **Có** | Dòng 485 nguyên văn |
| optionB | A | **Có** | Dòng 489 nguyên văn, giữ dấu gạch nối gộp của tài liệu lý thuyết (không theo dạng dấu phẩy của ngân hàng trắc nghiệm) |
| optionC | A | **Có** | Dòng 496 nguyên văn. Cận điểm ở dòng 498 ("quan hệ hằng ngày", "nghiêm khắc với mình") đã được loại: tiêu đề 496 gán mục này cho "người khác", và viết "hằng ngày" khác với "hàng ngày" ở đề bài |
| optionD | A | **Có** | Dòng 501 nguyên văn, củng cố bởi 502 |
| explanation | A | **Có** | Hai mảnh trích đúng từng ký tự: dòng 489 và dòng 490. Không thêm giáo lý nào |
| conceptLabel | A | Không | "Phẩm chất đạo đức cơ bản" = dòng 484; số "bốn" là phép đếm 1)-2)-3)-4)- với khối đóng ở 504 trước tiêu đề mới ở 506 |
| provenance | A | Không | Mọi số dòng đã mở lại và khớp; khai đúng bản PDF là cùng văn bản; khai đúng câu 35 là tham chiếu song song KHÔNG có đáp án |

**Nội dung ngoài tài liệu:** không có.
**Ghi chú không chặn phát hành:** explanation viết "phẩm chất này" (cả cụm đã gộp) trong khi chủ ngữ ngữ pháp ở dòng 490 chỉ là "Cần, kiệm, liêm, chính". Căn cứ chấm vẫn là ngoặc đơn ở dòng 489 vốn bao trọn cả mục, và không phương án nào khác chứa "Cần, kiệm, liêm, chính" nên việc phân biệt không bị ảnh hưởng. Bản thân tài liệu cũng tự mâu thuẫn nhẹ ở dòng 507 (dùng dấu phẩy thay dấu gạch nối) — câu hỏi bỏ qua đúng cách.

### 3.2 q2-ban-cam-ket-mot-thang — **ĐẠT** (đã kiểm chéo)

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | B | Không | "Bản cam kết một tháng" — nhãn tình huống hư cấu, không chứa khẳng định giáo lý |
| prompt | B | **Có** | Nhân vật "Minh", bản cam kết, hai tuần đầu — khung truyện hợp lệ. Cụm định vị "Theo Chủ đề 8" là A (lichtrinh-chude.md dòng 19). Tình huống chỉ mô tả *hành vi*, không nhét dữ kiện giáo lý |
| optionA | B | Không | "thiếu năng lực chuyên môn" — `grep "chuyên môn"` trên toàn tệp lý thuyết = **0 kết quả**; bị bác bằng chính tình huống |
| optionB | B | Không | Nhiễu tầng truyện; bị bác bởi dòng 510 và 511 (mức A) |
| optionC | A | **Có** | "rèn luyện bền bỉ suốt đời" khớp nguyên văn dòng 510; tên tiểu mục dòng 509. Chữ "nhất thời" là cách phủ định của chính phương án (`grep "nhất thời"` = 0 kết quả), không trình bày như trích dẫn |
| optionD | B | Không | Quy vấn đề về hình thức văn bản; dòng 509-511 không đặt điều kiện nào về độ chi tiết. Ý "lấy hiệu quả làm thước đo" nằm ở dòng 513, thuộc mục 2 |
| explanation | A | Không | Trích đúng nguyên văn dòng 510 kể cả "hằng ngày"; nêu song song hai cách gọi và dẫn nguồn cho từng chữ |
| conceptLabel | A | Không | Nguyên văn tiêu đề tiểu mục dòng 509 |
| provenance | A | Không | Mọi dòng đã mở lại và khớp, kể cả hai lỗi gõ "mmục tiêu" / "phụng sử" ở dòng 511 |

**Nội dung ngoài tài liệu:** không có.
**Hai ghi chú không chặn phát hành (trường nội bộ, sinh viên không thấy):**
- Lệch một dòng: provenance viết "mục đóng lại ở dòng 522"; thực tế gạch đầu dòng cuối của mục là **521**, còn **522** đã là tiêu đề mục kế ("- HỌC TẬP VÀ LÀM THEO TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH TRONG TÌNH HÌNH HIỆN NAY"). Khẳng định then chốt "không có mục thứ tư" vẫn đúng.
- Nhãn ghép trong explanation: cụm 'nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới' hoà hai cụm khác nhau — lichtrinh-chude.md dòng 19 viết "nguyên tắc xây dựng đạo đức **cách mạng**", còn dòng 506 viết "Biện pháp xây dựng đạo đức **mới**". Không tài liệu nào chứa chuỗi "nguyên tắc xây dựng đạo đức mới". Đây là mức C nhưng nằm ở phần **không được chấm**, và ngoặc đơn đã nêu đúng chữ của tài liệu → không vi phạm quy tắc phát hành.

### 3.3 q3-ba-ke-dich — **ĐẠT**

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | A | Không | "ba kẻ địch" và ý "phải chống" đều nguyên văn dòng 518 |
| prompt | A | **Có** | Tên mục = dòng 516 nguyên văn; mệnh đề "thường xuyên phải chống lại ba kẻ địch" = dòng 518. Không dùng chữ "nguyên tắc"/"biện pháp" |
| optionA | A | Không | "Tham ô, lãng phí, quan liêu" chỉ có ở tracnghiem.md dòng 1772 và 1797 (CHƯƠNG VI — phần nhà nước). `grep "tham ô"` trên tệp lý thuyết = 0 kết quả |
| optionB | B | Không | Rút gọn danh mục nguy cơ ở dòng 613, thuộc CHƯƠNG 6 PHƯƠNG PHÁP CÁCH MẠNG VÀ PHONG CÁCH HỒ CHÍ MINH; tài liệu gọi đó là "nguy cơ", không phải "kẻ địch" |
| optionC | B | Không | Ghép kẻ địch 1 và 3 với chất liệu ở dòng 517 (mô tả thói xấu đảng viên). Bẫy chính; bị bác vì dòng 518 gọi đích danh "thói quen và truyền thống lạc hậu cũng là kẻ địch to" |
| optionD | A | **Có** | Khớp từng chữ và đúng thứ tự dòng 518 |
| explanation | A | **Có** | Trích nguyên văn dòng 518, kể cả ba dấu chấm phẩy ngăn vế. Không thêm một chữ diễn giải |
| conceptLabel | A | Không | Chỉ sắp xếp lại cụm của dòng 518 |
| provenance | A | Không | Đã mở lại toàn bộ: 463-464, 506, 516, 517, 518, 613, 527-528, PDF 887/906-908, tracnghiem 1596/1770-1774/1794-1798/1842 |

**Nội dung ngoài tài liệu:** không có. Đặc biệt, cụm "giặc nội xâm" (chỉ có ở tracnghiem.md dòng 1770) **không** bị mang vào phần sinh viên thấy.
**Kiểm tra bổ sung:** `grep "kẻ địch"` trên tracnghiem.md = 0 kết quả → ngân hàng không tạo ra cách gọi tên hay cách đếm cạnh tranh nào.

### 3.4 q4-ban-nhan-loi-va-sua — **PHẢI SỬA**

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | B | Không | "Bạn nhận lỗi và sửa" — nhãn tình huống, suy ra từ dòng 499 |
| prompt | B | **Có** | Tình huống làm nhóm hư cấu (hợp lệ). Neo duy nhất là "Chủ đề 8" — A, lichtrinh-chude.md dòng 19. Hai dữ kiện tình huống (đã nhận lỗi trước cả nhóm; xin làm lại) chính là hai điều kiện dòng 499 đòi hỏi |
| optionA (khoá) | **D** | **Có** | Vế đầu "cho bạn tự sửa lại" là A (dòng 499). Nhưng vế **"và chỉ rõ chỗ sai để cùng rút kinh nghiệm"** không có trong bất kỳ tài liệu nào: `grep "rút kinh nghiệm"` = **0 kết quả trên cả năm tệp**; `grep "chỉ rõ"` trên decuong-lythuyet.md chỉ trúng dòng 197 (văn kiện, bối cảnh Chương 3), hoàn toàn ngoài khối đạo đức 463-525. Sinh viên **bắt buộc phải chọn A** mới ghi điểm → đây là nội dung được chấm, không phải khung truyện |
| optionB | B | **Có** | Tính sai là A: dòng 499 gọi đích danh đối tượng phải thương yêu; dòng 500 "phải có tình đồng chí thương yêu lẫn nhau". Mồi nhử "vì lợi ích chung" bị bác đúng bởi dòng 495 |
| optionC | B | **Có** | Tính sai là A: tước mất điều kiện thứ hai của dòng 499 ("và cố gắng sửa chữa"); dòng 498 định nghĩa độ lượng là "rộng rãi, độ lượng với người khác", không phải miễn việc sửa sai |
| optionD | A | **Có** | Lật ngược gần như nguyên văn dòng 498 |
| explanation | **C→D** | Không (nhưng hiển thị cho sinh viên) | Nửa đầu là A (dòng 499 nguyên văn). Nửa sau — 'chỉ rõ chỗ sai là tinh thần "xây đi đôi với chống"' — là **diễn giải tài liệu không hề nêu**. Đã đọc nguyên văn 516-521: 516 chỉ là tiêu đề; 517 thói xấu đảng viên; 518 ba kẻ địch; 519 đấu tranh chống kẻ địch; 520 "Chống và xây phải đi liền với nhau…"; 521 "xây là nhiệm vụ chủ yếu và lâu dài". **Không chỗ nào** gọi việc chỉ ra lỗi của người khác là xây hay chống |
| conceptLabel | A | Không | Nguyên văn dòng 496 |
| provenance | A | Không | Mọi trích dẫn chính xác; khai đúng PDF là cùng văn bản; từ chối viện dẫn ngân hàng không đáp án. Tuy nhiên có tự khai "Vế 'chỉ rõ chỗ sai' mượn từ dòng 516 và dòng 520" — tức chính tác giả cũng biết vế này là đi mượn |

**Nội dung ngoài tài liệu (mức D):**
1. `chỉ rõ chỗ sai` — không có trong khối đạo đức của cả hai bản xuất.
2. `để cùng rút kinh nghiệm` — 0 kết quả trên toàn bộ năm tệp. Văn bản gần nhất, dòng 520 ("Lấy gương người tốt việc tốt hàng ngày giáo dục lẫn nhau"), nói một điều **khác**: giáo dục bằng tấm gương tốt, không phải chỉ ra lỗi của người khác.
3. Phương trình giáo lý trong explanation: 'chỉ rõ chỗ sai là tinh thần "xây đi đôi với chống"' — trình bày cho sinh viên **như giáo trình**, trong khi trường nội bộ `distractorRationale` lại tự thú nhận đó là "diễn đạt vận dụng, không phải trích dẫn". Phần sinh viên thấy không có lời rào đón này.

**Điểm quyết định — sổ ghi bất đồng của chính dự án đã phán quyết ngược lại:** `docs/content-source.md` §4 (dòng 4) ghi *"Phê bình và tự phê bình là nguyên tắc tổ chức của Đảng, không phải biện pháp xây dựng đạo đức."* §3.4 nhắc lại: *"Mục này không có trong Chương 6; trong tài liệu lý thuyết nó chỉ là nguyên tắc tổ chức của Đảng ở Chương 4."* **"Chỉ rõ chỗ sai" chính là phê bình.** Đã kiểm trực tiếp: `grep "phê bình"` trên decuong-lythuyet.md chỉ cho 4 kết quả — dòng 296, 314, 324, 395 — **tất cả đều nằm ngoài chương đạo đức (463-525)**. Vậy phần giải thích không chỉ thiếu chỗ dựa, mà còn nhập vào chương đạo đức đúng cái khái niệm mà dự án đã quyết là thuộc chỗ khác.

**Kết luận:** vi phạm điều kiện 1 của quy tắc phát hành (có phần tử D trong nội dung được chấm). → **PHẢI SỬA**, xem §6.
**Phần còn lại của câu là lành mạnh:** lý do thực sự khiến A đúng (dòng 499, củng cố bởi 498 và 500) là mức A; cả ba phương án nhiễu đều bị bác bằng dòng nguyên văn; không viện dẫn đáp án ngân hàng; sinh viên không cần kiến thức ngoài tài liệu.

### 3.5 q5-ba-nguyen-tac — **ĐẠT**

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | A | Không | 'Ba nguyên tắc — tài liệu gọi là "biện pháp"'. Chữ "biện pháp" = dòng 506 nguyên văn; số "ba" = phép đếm 509/512/516; chữ "nguyên tắc" có ở huongdan-thaoluan.md dòng 18 và tracnghiem.md dòng 2075. **Nêu cả hai cách gọi** |
| prompt | A | **Có** | Tài liệu tự xưng "ĐỀ CƯƠNG TÓM TẮT / HCM202" ở dòng 2-3. Mệnh đề "chỉ đánh số đúng ba nội dung" kiểm chứng được: giữa 506 và 522 chỉ có ba mục đánh số. Đề bài **tự giới hạn phạm vi vào một tài liệu**, nên sinh viên không phải tự phân xử bất đồng ba-hay-bốn |
| optionA | A | **Có** | = dòng 512 nguyên văn, giữ nguyên dạng đã gộp ("Nói đi đôi với làm, nêu gương đạo đức") |
| optionB (khoá) | A | **Có** | "Tự phê bình và phê bình" — đúng trật tự chữ của tài liệu lý thuyết (dòng 314 "+ Nguyên tắc tự phê bình và phê bình."). `grep "phê bình"` trên toàn tệp = 4 kết quả (296, 314, 324, 395), **không kết quả nào trong khối 463-525** → mệnh đề "không nằm trong ba nội dung" là **sự kiện văn bản kiểm chứng được** |
| optionC | A | **Có** | = dòng 516 nguyên văn |
| optionD | A | **Có** | = dòng 509 nguyên văn |
| explanation | A | **Có** | Mỗi vế khớp văn bản; lý do đáp án đúng **thuần tuý là phép đếm** trong một mục có ranh giới rõ (506 → 521), không viện dẫn học thuyết ngoài tài liệu, không dựa vào đáp án trắc nghiệm |
| conceptLabel | A | Không | Vế đầu = dòng 506 nguyên văn; vế sau ("ở mục này tài liệu không dùng chữ 'nguyên tắc'") đã kiểm: quét 460-530 tìm "nguyên tắc" cho **0 kết quả**. Nhãn chủ động phơi bày bất đồng tên gọi |
| provenance | A | Không | Đã mở lại toàn bộ; cảnh báo trích xuất "509 và 516 có tiền tố '####', 512 thì không" **đúng** (đã xác nhận bằng `grep '^####'`) |

**Nội dung ngoài tài liệu:** không có.
**Rủi ro đã được tác giả chặn trước, đã xác nhận là có thật:** nếu giải thích bằng tiêu chí "vì nó nằm ở phần xây dựng Đảng" thì tiêu chí đó **không phân biệt được**, vì "Xây phải đi liền với chống, lấy xây để chống" cũng có ở CHƯƠNG 4 dòng 308 — sinh viên áp tiêu chí ấy sẽ chọn nhầm C. Trường explanation đưa cho sinh viên chỉ dùng phép đếm, không dùng tiêu chí vị trí chương. Đúng cách.
**Hai ghi chú không chặn phát hành:**
- provenance có một chỗ dễ đọc nhầm: "(tiêu đề dòng 283; đối chứng PDF dòng 602)" — PDF dòng 602 đối chứng cho dòng 314, còn tiêu đề CHƯƠNG 4 trong PDF ở dòng 541.
- **Lỗi ở tài liệu khác, không phải ở câu hỏi:** `docs/content-source.md` §3.4 ghi "nguyên tắc tổ chức của Đảng ở Chương 4 (dòng 315)". Dòng 315 thực tế là "+ Kỷ luật nghiêm minh, tự giác."; dòng đúng là **314**. Chuỗi provenance của câu hỏi ghi 314 và ghi đúng. Nên sửa `content-source.md` cho khớp.

### 3.6 q6-quy-nhom-xung-dot-loi-ich — **ĐẠT** (đã kiểm chéo)

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | B | Không | "Quỹ nhóm và chỗ quen" — bối cảnh sinh viên hư cấu |
| prompt | B | Không | Quỹ in ấn / tiệm in người thân / khoản chia lại — tình huống dựng để hiện thực hoá phẩm chất ở dòng 489. Không tự khẳng định giáo lý nào |
| optionA | B | Không | Bị bác bởi dòng 498 (nghiêm khắc với mình trước — phương án lật ngược). Còn một căn cứ mạnh hơn: đề bài nêu tiệm người thân **báo giá cao hơn**, nên chọn nó là tiêu tiền nhóm lãng phí, trái thẳng định nghĩa **Kiệm** ở dòng 492 |
| optionB | B | Không | Bị bác bởi định nghĩa **Liêm** nguyên văn, dòng 493 |
| optionC | B | Không | Bị bác bởi định nghĩa **Chính** nguyên văn, dòng 494 |
| optionD (khoá) | A | **Có** | Mỗi vế ứng một định nghĩa nguyên văn cùng mục: từ chối khoản chia riêng = dòng 493 "không tham lam"; nói rõ quan hệ = dòng 494 "thẳng thắn, đứng đắn"; để nhóm tự quyết = dòng 495 "đừng nghĩ đến mình trước" |
| explanation | A | **Có** | Ba mảnh trích đã kiểm nguyên văn (493, 494, 495). Câu mở "Quỹ nhóm là của chung." là tiền đề tình huống, không mang trọng lượng chấm điểm |
| conceptLabel | A | Không | Tái hiện đúng cách gộp và dấu gạch nối ở dòng 489 — giữ **một** phẩm chất, không tách chí công vô tư thành phẩm chất thứ năm |
| provenance | A | Không | Đã mở lại toàn bộ hai bản xuất; khai đúng PDF là cùng văn bản; khai đúng không dùng ngân hàng (`grep "xung đột"` trên tracnghiem.md = 0 kết quả) |

**Hai ghi chú minh bạch, không cần sửa:**
- Thuật ngữ "xung đột lợi ích" không có trong tài liệu theo nghĩa này (chỉ có "xung đột sắc tộc" trong phần quan hệ quốc tế). Nó **chỉ** xuất hiện ở `id` câu hỏi và ở `distractorRationale`. Đã xác minh bằng mã nguồn: `src/lib/game/types.ts:61` ghi `distractorRationale` là "Documentation only — never sent to players", và `types.ts:70-83` (PublicQuestion) loại bỏ `correctIndex`, `explanation`, `distractorRationale` khỏi dữ liệu gửi đi → cụm này **không tới sinh viên**, không được chấm.
- Áp "của công và của dân" (dòng 493) vào quỹ nhóm sinh viên là một bước liên hệ, đã được `distractorRationale` khai báo. Thực ra bước này **phần lớn là không cần thiết**: dòng 492 định nghĩa **Kiệm** là "tiết kiệm tiền của của dân, của nước, **của bản thân mình**" — tài liệu tự mở rộng bổn phận tiết kiệm sang tiền của cá nhân và tiền chung thông thường. Ngoài ra đáp án vẫn đứng vững mà không cần bước ấy: 493 loại B, 494 loại C, 495 chống đỡ D.
- Về bất đồng trích xuất ở dòng 494 ("Chính nghĩa là không tà…" dễ đọc nhầm thành từ ghép "chính nghĩa"): `content-source.md` §4.1 yêu cầu viết lại thành "Chữ CHÍNH nghĩa là…" khi trích. Bản phát hành **vượt yêu cầu**: explanation không trích phần đầu mơ hồ, chỉ trích phần đuôi rõ nghĩa "thẳng thắn, đứng đắn" dưới nhãn "Chính:". Mơ hồ được **tránh hẳn** ở phần sinh viên thấy.
- Ghi nhận cho giảng viên: explanation chỉ nêu ba căn cứ khẳng định, không nói vì sao A sai. Khi chữa bài nên nói miệng căn cứ dòng 492 (Kiệm) và dòng 498, vì A là phương án hấp dẫn nhất với sinh viên bám vào "thương yêu con người".

### 3.7 q7-xay-di-doi-voi-chong — **ĐẠT**

| Phần tử | Mức | Chấm điểm | Căn cứ |
|---|---|---|---|
| title | A | Không | "Xây và chống, cái nào chủ yếu" — đặt lại câu hỏi bằng chính từ của dòng 521 |
| prompt | B | Không | Tình huống "ghi khống phần việc" là khung truyện; câu hỏi thực sự trỏ thẳng vào dòng 520-521, đổi tình huống thì đáp án không đổi |
| optionA | A | **Có** | Bị bác tường minh bởi dòng 521, vốn đặt **xây** vào vị trí "nhiệm vụ chủ yếu và lâu dài" |
| optionB | A | **Có** | Trái chữ "lâu dài" (521) và trái dòng 520 |
| optionC (khoá) | A | **Có** | Trích nguyên văn mệnh đề dòng 521, cắt đúng ranh giới mệnh đề tại "…chủ yếu và lâu dài", không thêm chữ nào |
| optionD | A | **Có** | Bị bác bởi dòng 520 "Chống và xây phải đi liền với nhau." và cụm "đi liền với xây" ở 521 |
| explanation | A | **Có** | Chỉ gồm nhãn "Nguyên văn tài liệu:" + trích dòng 521. Khớp ký tự, kể cả việc **không** có dấu phẩy trước "nhưng" |
| conceptLabel | A | Không | Nguyên văn tiểu mục dòng 516; không nói "nguyên tắc"/"biện pháp", không nêu con số 3 hay 4 |
| provenance | A | Không | Đã xác minh từng số dòng. Chỉ hiển thị cho host (`src/components/host/host-room-panel.tsx` dòng 232-233) |

**Kiểm tra bổ sung:** `grep "chủ yếu và lâu dài"` trên toàn thư mục trích xuất = **đúng hai kết quả**, là cùng một câu ở hai bản xuất của cùng một tài liệu → không có "sự chứng thực độc lập" giả nào.
**Ghi nhận không chặn phát hành, không đề nghị sửa:** đáp án đúng là phương án duy nhất trích nguyên văn tài liệu nên có tín hiệu "test-wiseness" nhẹ; tiêu đề cũng hé lộ trục phân biệt "chủ yếu". Sửa điểm này là thiết kế lại câu hỏi, nằm ngoài phạm vi kiểm duyệt nội dung.

---

## 4. Bốn điểm mơ hồ đã biết

### 4.1 "Biện pháp" hay "nguyên tắc"?

**Hiện trạng.** Tài liệu lý thuyết đặt tiêu đề mục là **"Biện pháp xây dựng đạo đức mới"** (decuong-lythuyet.md dòng 506). Tên chủ đề (lichtrinh-chude.md dòng 19), khung thảo luận (huongdan-thaoluan.md dòng 18) và ngân hàng trắc nghiệm (câu 39, dòng 2075) đều dùng chữ **"nguyên tắc"**. Không tài liệu nào chứa chuỗi "nguyên tắc xây dựng đạo đức mới".

**Có đáp án nào được chấm dựa vào nó không?** **KHÔNG.** Không câu nào bắt sinh viên chọn giữa hai cách gọi.
- q5 là câu duy nhất nhắc tới mục này ở phần sinh viên thấy, và nó **nêu cả hai chữ** trong tiêu đề, đề bài và `conceptLabel` ("tài liệu gọi là 'biện pháp'"), đúng quy ước bất đồng #3 của `content-source.md`, vốn khuyến nghị "không ra câu hỏi về cách gọi".
- q3 và q7 đều nằm bên trong mục này nhưng **không dùng chữ nào trong hai chữ** ở phần sinh viên thấy — đã kiểm title/prompt/options/explanation.
- q2 chỉ nhắc ở nhãn giải thích, nêu song song hai chữ kèm nguồn.

**Cách giải quyết.** Luôn dùng chữ của tài liệu lý thuyết ("biện pháp") làm chữ chính, kèm chữ của tên chủ đề ("nguyên tắc") trong ngoặc, và không bao giờ chấm điểm trên cách gọi. **Không ảnh hưởng tới bất kỳ đáp án nào.**

### 4.2 Ba mục hay bốn mục?

**Hiện trạng.** Tài liệu lý thuyết liệt kê **đúng ba** mục đánh số: (1) Tu dưỡng đạo đức suốt đời (dòng 509), (2) Nói đi đôi với làm, nêu gương đạo đức (512, đã gộp), (3) Xây đi đôi với chống (516). Ngân hàng trắc nghiệm câu 39 ngụ ý **bốn** bằng cách thêm phương án "Phê bình và tự phê bình".

**Có đáp án nào được chấm dựa vào nó không?** **CÓ — đúng một câu: q5.** Đây là điểm phân biệt được chấm của q5, nên phải xét theo ngoại lệ của quy tắc phát hành.

**Cách giải quyết — dứt khoát, bằng tài liệu có thẩm quyền nhất:**
1. Đề cương lý thuyết là văn bản **trình bày** duy nhất do môn học biên soạn, và nó đóng mục ở đúng ba mục đánh số: giữa dòng 506 và dòng 522 chỉ có 509/512/516; dòng 521 là gạch đầu dòng cuối, dòng 522 đã sang phần "HỌC TẬP VÀ LÀM THEO…".
2. Bản xuất PDF của cùng văn bản đánh số **đồng đều** 1)/2)/3) ở dòng 891/897/902 rồi chuyển hẳn sang mục "III." ở dòng 918 — điều này quan trọng vì bản docx bị lỗi cấp tiêu đề (509 và 516 có tiền tố Markdown `####`, còn 512 thì không), nên bản PDF loại trừ nguy cơ bỏ sót mục 2. Đây đúng là khuyến nghị ở bất đồng #12 của `content-source.md`.
3. Ngân hàng trắc nghiệm **không thể** khẳng định con số bốn: câu 39 chỉ liệt kê bốn *phương án* cho một câu hỏi "nguyên tắc quan trọng bậc nhất", và ngân hàng **không có đáp án ở bất kỳ đâu**. Một phương án nhiễu không phải một mệnh đề của tài liệu.
4. Quan trọng nhất: **đề bài q5 không bắt sinh viên phân xử bất đồng này.** Nó nêu rõ phạm vi ("Trong Đề cương tóm tắt môn học… chỉ đánh số đúng ba nội dung") và hỏi một sự kiện đếm được bên trong phạm vi đó.

**Kết luận:** bất đồng có được chấm, nhưng **đã được giải quyết** — thoả điều kiện 3 của quy tắc phát hành. Không câu nào khác đếm hay liệt kê danh sách này.

### 4.3 "Phê bình và tự phê bình"

**Hiện trạng.** Tài liệu lý thuyết viết theo trật tự **"tự phê bình và phê bình"** (dòng 314: "+ Nguyên tắc tự phê bình và phê bình.") và đặt nó ở **chương xây dựng Đảng (CHƯƠNG 4)**, không nằm trong ba mục của chương đạo đức. Ngân hàng trắc nghiệm câu 39 viết ngược trật tự ("Phê bình và tự phê bình") và đặt nó như một phương án của chương đạo đức.

**Có đáp án nào được chấm dựa vào nó không?** **CÓ — q5, và đây chính là đáp án khoá (phương án B).**

**Cách giải quyết.** Bằng sự kiện văn bản, không bằng phán đoán học thuật: `grep "phê bình"` trên toàn bộ decuong-lythuyet.md cho **đúng bốn kết quả — dòng 296, 314, 324, 395 — không kết quả nào nằm trong khối 463-525** (chương đạo đức). Vậy mệnh đề "không nằm trong ba nội dung" là một phép đối chiếu văn bản kiểm chứng được, không phải suy diễn giáo lý. Câu hỏi dùng **trật tự chữ của tài liệu lý thuyết** ("Tự phê bình và phê bình"), đúng thẩm quyền.

**Một cạm bẫy đã được chặn.** Nếu giảng viên giải thích q5 bằng tiêu chí "vì nó nằm ở phần xây dựng Đảng" thì tiêu chí đó **không phân biệt được**, vì "Xây phải đi liền với chống, lấy xây để chống" cũng xuất hiện ở CHƯƠNG 4 dòng 308. Trường `explanation` đưa cho sinh viên chỉ dùng phép đếm, và `distractorRationale` đã ghi cảnh báo này cho giảng viên.

**Liên quan tới q4 (lỗi phải sửa).** Sổ ghi bất đồng §4 và §3.4 của `content-source.md` đã phán quyết: *"Phê bình và tự phê bình là nguyên tắc tổ chức của Đảng, không phải biện pháp xây dựng đạo đức."* Phần giải thích hiện tại của q4 gọi việc "chỉ rõ chỗ sai" — tức **phê bình** — là "tinh thần xây đi đôi với chống", tức nhập chính khái niệm này vào chương đạo đức, ngược với phán quyết đã có. Đây là một trong ba lý do bắt buộc sửa q4.

### 4.4 Ngân hàng trắc nghiệm không có đáp án

**Hiện trạng.** `tracnghiem.md` **không có đáp án ở bất kỳ đâu**. Không nội dung nào được phép trình bày như "đáp án của tài liệu".

**Có đáp án nào được chấm dựa vào nó không?** **KHÔNG — không một câu nào.** Đã kiểm từng câu:
- **q1**: có viện dẫn câu 35 (dòng 2051-2055), nhưng gắn nhãn "Tham chiếu song song, KHÔNG có đáp án", và `distractorRationale` nói thẳng "Ngân hàng trắc nghiệm không có đáp án ở bất kỳ đâu nên không được dùng làm căn cứ chấm." Toàn bộ việc khoá đáp án đứng trên dòng 489. (Ghi nhận: câu 34-37 của ngân hàng dùng chung một bộ phương án và sẽ không giải được nếu đứng một mình — q1 **không** thừa hưởng vấn đề đó vì nó thay bằng chính chú thích quan hệ của tài liệu lý thuyết làm mệnh đề phân biệt.)
- **q3**: viện dẫn câu 29 và 33 **chỉ để chỉ ra cụm "Tham ô, lãng phí, quan liêu" xuất hiện ở đâu**; rationale ghi rõ "Cả hai câu đều KHÔNG có đáp án, vì vậy tuyệt đối không được khẳng định bộ ba này là đáp án của bất kỳ câu nào."
- **q5**: dùng ngân hàng **làm nguồn phương án**, và khai rõ điều đó. Căn cứ chấm là phép đếm trên tài liệu lý thuyết.
- **q2, q4, q6, q7**: không viện dẫn ngân hàng. Đã xác nhận bằng `grep` — q6 còn được kiểm thêm (`grep "xung đột"` trên tracnghiem.md = 0 kết quả; quỹ/chia lại/người thân/tiệm đều không có) nên ngân hàng thực sự không được dùng.

**Cách giải quyết.** Ngân hàng chỉ được dùng ở hai vai trò: **nguồn văn phong cho phương án nhiễu** và **bằng chứng về việc một cụm từ xuất hiện ở đâu**. Không bao giờ dùng làm căn cứ chấm điểm. Mọi trường `provenance` có viện dẫn ngân hàng đều tự khai điều này.

---

## 5. Hai sự kiện cấu trúc về bộ nguồn

### 5.1 Hai bản xuất trùng nhau **không phải** là sự chứng thực lẫn nhau

`decuong-lythuyet.md` và `decuong-tthcm-pdf.md` là **một tài liệu ở hai lần kết xuất**, không phải hai nguồn độc lập. Bằng chứng: chúng dùng chung các lỗi gõ — "phục sự nhân dân", "mmục tiêu", "phụng sử Tổ quốc".

**Hệ quả:** việc hai tệp cùng nói một điều **không** làm tăng độ tin cậy của điều đó. Không câu hỏi nào được phép nói "hai tài liệu cùng khẳng định".

**Tình trạng tuân thủ:** đã kiểm cả bảy câu — **mọi** chuỗi `provenance` có nhắc bản PDF đều gắn nhãn "Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập". Không câu nào tuyên bố có chứng thực độc lập. Kiểm chứng cụ thể ở q7: `grep "chủ yếu và lâu dài"` trên toàn thư mục = đúng hai kết quả, là **cùng một câu** ở hai bản xuất — và provenance đã nêu đúng điều này.

**Ngoại lệ có ích duy nhất:** khi bản docx có lỗi cấp tiêu đề Markdown, bản PDF được ưu tiên vì nó bảo toàn cách đánh số. Trường hợp thực tế: dòng 509 và 516 có tiền tố `####` còn 512 thì không, khiến bản docx dễ bị đọc sót mục 2; bản PDF đánh số đều 1)/2)/3) ở 891/897/902. Đây không phải chứng thực chéo, mà là chọn bản kết xuất ít lỗi hơn của **cùng một** văn bản.

### 5.2 Đánh số chương và chủ đề khác nhau giữa các kỳ và các tệp

Có ba lớp đánh số xung đột, phải luôn xử lý tường minh:

1. **Hai chương cùng đánh số 6** trong `decuong-lythuyet.md`: dòng 463-464 là "CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH" (tiêu đề tách hai dòng), còn dòng 527-528 là "CHƯƠNG 6 / PHƯƠNG PHÁP CÁCH MẠNG VÀ PHONG CÁCH HỒ CHÍ MINH". **Quy tắc: luôn trích đủ tên chương, không bao giờ chỉ ghi "Chương 6".** Đã kiểm cả bảy câu — tất cả đều ghi đủ tên. Quy tắc này thực sự có tác dụng: phương án nhiễu B của q3 lấy chất liệu từ dòng 613, vốn thuộc chương **thứ hai**, và `distractorRationale` phân biệt được hai chương nhờ tên đầy đủ.

2. **Chương đạo đức mang số khác nhau giữa hai tệp:** trong đề cương lý thuyết nó là "CHƯƠNG 6", trong ngân hàng trắc nghiệm nó là "CHƯƠNG VII" (bắt đầu ở dòng 1842). Khi đối chiếu chéo phải dịch số chương, không giả định trùng số.

3. **Số hiệu chủ đề khác nhau theo kỳ:** `lichtrinh-chude.md` dòng 19 đánh số nội dung này là **Chủ đề 8** (kỳ Spring), còn `huongdan-thaoluan.md` dòng 18 đánh số **cùng nội dung** là **Chủ đề 7** (kỳ Summer). **Lớp đang dùng số 8.** Đã kiểm: q2 và q4 là hai câu nhắc số hiệu chủ đề ở phần sinh viên thấy, cả hai đều dùng "Chủ đề 8", khớp `lichtrinh-chude.md`.

---

## 6. Các sửa đổi bắt buộc trước khi phát hành

Chỉ **một** câu còn lỗi: **q4-ban-nhan-loi-va-sua**. Tất cả sửa đổi nằm trong `D:/Nguyen_Duc_Hoang_Phuc/FA26/HCM202/hcm360/src/lib/content/topic8.ts`, bên trong đối tượng có `id: 'q4-ban-nhan-loi-va-sua'`.

**Khớp theo chuỗi, không theo số dòng.** Số dòng thực tế: phương án khoá ở dòng **97**, explanation ở dòng **104**, provenance ở dòng **108**, distractorRationale ở dòng **112**.

**Không thay đổi:** số lượng phương án, `correctIndex: 0`, `difficulty: 'trung-binh'`, `durationSec: 22`, `title`, `prompt`, `conceptId`, `conceptLabel`.

### SỬA 1 — phương án khoá (dòng 97) — CHẶN PHÁT HÀNH

```
từ:  { text: 'Cho bạn tự sửa lại và chỉ rõ chỗ sai để cùng rút kinh nghiệm' },
thành: { text: 'Cho bạn tự sửa lại phần số liệu đã làm sai' },
```

Xoá thuần tuý hai cụm không có trong tài liệu, không thêm chữ nào ngoài từ ngữ của chính tình huống. Chọn cách này thay vì một bản thay thế dài hơn vì: (a) không nhúng lý do của đáp án vào phương án mà sinh viên phải chọn; (b) không biến A thành phương án dài nhất, tránh tín hiệu độ dài trỏ vào đáp án. Độ tương phản với phương án C ("Bỏ qua, không cần sửa lại số liệu nữa…") vẫn sắc nét và được quyết định thuần tuý bằng dòng 499.

### SỬA 2 — explanation (dòng 104) — CHẶN PHÁT HÀNH

```
từ:  'Tài liệu: yêu thương cả người "có sai lầm, khuyết điểm, nhưng đã nhận rõ khuyết điểm, sai lầm và cố gắng sửa chữa"; chỉ rõ chỗ sai là tinh thần "xây đi đôi với chống".'
thành: 'Tài liệu: yêu thương cả người "có sai lầm, khuyết điểm, nhưng đã nhận rõ khuyết điểm, sai lầm và cố gắng sửa chữa"; và đòi hỏi "nghiêm khắc với mình, rộng rãi, độ lượng với người khác".'
```

Sau sửa, cả hai vế đều là trích nguyên văn (dòng 499 và dòng 498); khẳng định "xây đi đôi với chống" bị loại bỏ. Vế thứ hai còn kiêm luôn vai trò bác bỏ phương án D.

### SỬA 3 — siêu dữ liệu nội bộ, **đi cùng một lượt, không phải tuỳ chọn**

Ba trường này không hiển thị cho sinh viên nên không chặn phát hành, **nhưng phải sửa trong cùng lượt** — nếu không, hồ sơ kiểm chứng sẽ tiếp tục khẳng định một sự "đi mượn" không còn tồn tại, và cách đọc xây/chống vẫn sống sót trong hồ sơ.

**3a — provenance (dòng 108):** xoá nguyên câu sau, giữ nguyên từng chữ phần trước và phần sau nó:
```
Vế "chỉ rõ chỗ sai" mượn từ dòng 516 và dòng 520, thuộc nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới, tiêu đề ở dòng 506. 
```

**3b — distractorRationale (dòng 112):** xoá nguyên câu sau:
```
Vế "chỉ rõ chỗ sai để cùng rút kinh nghiệm" là luận cứ MƯỢN từ mục "3)- Xây đi đôi với chống" (dòng 516) thuộc nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới: "Chống và xây phải đi liền với nhau. Lấy gương người tốt việc tốt hàng ngày giáo dục lẫn nhau…" (dòng 520); đây không phải nội dung của phần phẩm chất, và cụm "chỉ rõ chỗ sai" là diễn đạt vận dụng, không phải trích dẫn. 
```

**3c — distractorRationale (dòng 112), cùng trường:** xoá mệnh đề đuôi
```
, và bỏ hẳn việc sửa cũng là chỉ xây mà bỏ chống (dòng 520)
```
để câu nói về phương án C kết thúc ở "…không phải miễn luôn việc sửa sai."

**Giữ nguyên** phần bác phương án B bằng dòng 495 và phần bác phương án D bằng dòng 498 — cả hai đã được kiểm nguyên văn và chính xác.

### Sau khi sửa

Mọi phần tử được chấm của q4 trở về mức **A**, dựa trên dòng 498-500; tình huống vẫn là khung truyện mức **B** hợp lệ; không còn mức **C** nào được chấm; không còn mức **D**; không viện dẫn đáp án ngân hàng; "cần kiến thức ngoài tài liệu" vẫn là **không**. Khi đó cả bảy câu đều ĐẠT và có thể chuyển kết luận sang PASS.

### Việc dọn dẹp không chặn phát hành (tuỳ chọn, ở tệp khác)

- `docs/content-source.md` §3.4: sửa "(dòng 315)" thành "(dòng 314)" — dòng 315 thực tế là "+ Kỷ luật nghiêm minh, tự giác."
- `topic8.ts`, provenance của q2: "mục đóng lại ở dòng 522" → "mục đóng lại ở dòng 521, dòng 522 đã là tiêu đề mục kế".
- `topic8.ts`, provenance của q5: "(tiêu đề dòng 283; đối chứng PDF dòng 602)" → "(tiêu đề dòng 283; đối chứng PDF: tiêu đề chương dòng 541, câu then chốt dòng 602)".

---

## 7. Kết luận

| Tiêu chí phát hành | Kết quả |
|---|---|
| Mọi sự kiện cần để chấm điểm đều là SOURCE-EXPLICIT (A) | **KHÔNG** — q4 có mức D trong phương án khoá và trong phần giải thích hiển thị cho sinh viên |
| Không câu nào đòi kiến thức ngoài tài liệu | **CÓ** — cả bảy câu đều trả lời được chỉ bằng năm tệp được cấp |
| Không điểm phân biệt được chấm nào dựa trên bất đồng chưa giải quyết | **CÓ** — bất đồng duy nhất được chấm (ba hay bốn mục, ở q5) đã được tài liệu có thẩm quyền nhất giải quyết dứt khoát |

6/7 câu ĐẠT và giữ nguyên. 1/7 câu (q4-ban-nhan-loi-va-sua) phải sửa theo §6 — hai sửa đổi chặn phát hành cộng ba sửa đổi siêu dữ liệu đi kèm. Sau khi áp dụng, kiểm lại và chuyển kết luận sang PASS.

CONTENT SCOPE: FAIL *(lượt đầu — xem §8 cho kết luận cuối)*

---

## 8. Sau khi sửa — thẩm định lại và kết luận cuối

### 8.1 Ba sửa đổi đã áp dụng

| # | Trường | Trước | Sau |
|---|---|---|---|
| SỬA 1 | `options[0].text` | "Cho bạn tự sửa lại và chỉ rõ chỗ sai để cùng rút kinh nghiệm" | "Cho bạn tự sửa lại phần số liệu đã làm sai" |
| SỬA 2 | `explanation` | …"; chỉ rõ chỗ sai là tinh thần "xây đi đôi với chống"." | …"; và đòi hỏi "nghiêm khắc với mình, rộng rãi, độ lượng với người khác"." |
| SỬA 3 | `provenance`, `distractorRationale` | ba mệnh đề viện dẫn dòng 516/520 để biện hộ cho vế đã bị xoá | đã xoá cả ba (trường nội bộ, người chơi không thấy) |

### 8.2 Bằng chứng kiểm chứng lại

Do một lượt kiểm **độc lập**, đọc lại tệp nguồn chứ không dựa vào báo cáo trước:

- `grep -rn "rút kinh nghiệm"` trên **cả năm** tệp → **0 kết quả**. Cụm ngoài tài liệu đã biến mất khỏi nội dung được chấm.
- `grep -rn "chỉ rõ"` → 5 kết quả, tất cả nằm ngoài khối đạo đức (dòng 463-525): dòng 197 bản lý thuyết, dòng 386 bản PDF, và ba câu trong ngân hàng trắc nghiệm ở các chương khác. Không kết quả nào liên quan.
- `sed -n '463,525p' | grep "phê bình\|nguyên tắc"` → **0 kết quả**: câu hỏi nay hoàn toàn tách khỏi vùng tranh chấp "phê bình và tự phê bình".
- Hai trích dẫn trong `explanation` đối chiếu bằng `grep -F`: cụm "có sai lầm, khuyết điểm, nhưng đã nhận rõ khuyết điểm, sai lầm và cố gắng sửa chữa" khớp **nguyên văn** dòng 499; cụm "nghiêm khắc với mình, rộng rãi, độ lượng với người khác" khớp **nguyên văn** dòng 498.
- Mọi số dòng trong `provenance` đều giải được đúng như khai báo, kể cả chỗ câu bị ngắt dòng ở bản PDF (872-873).

### 8.3 Phân loại lại q4

| Phần tử | Mức | Được chấm? |
|---|---|---|
| title | B | Không |
| prompt | B | Không (khung truyện) |
| **options[0] — đáp án khoá** | **A** | **Có** — dòng 499 nêu chính hai điều kiện mà tình huống dựng lại: đã nhận rõ lỗi, và "cố gắng sửa chữa" |
| options[1] | A (bị bác bằng dòng 499, 500) | Có |
| options[2] | A (bị bác bằng dòng 499, 498) | Có |
| options[3] | A (lật ngược nguyên văn dòng 498) | Có |
| explanation | A | Có |
| conceptLabel | A (tiêu đề dòng 496) | Không |

**Không còn phần tử mức D ở bất kỳ đâu. Không phần tử được chấm nào dưới mức A.**

### 8.4 Kết luận cuối

Cả bảy câu đều thoả ba điều kiện phát hành:

1. mọi sự kiện cần để ghi điểm đều là **SOURCE-EXPLICIT (A)**;
2. không câu nào đòi kiến thức ngoài năm tệp được cấp;
3. không điểm phân biệt được chấm nào dựa trên một bất đồng chưa giải quyết — điểm duy nhất được chấm có chạm bất đồng là q5 (đếm ba mục), và tài liệu lý thuyết giải quyết dứt khoát bằng cách đánh số 1)/2)/3) rồi chuyển sang mục III.

CONTENT SCOPE: PASS
