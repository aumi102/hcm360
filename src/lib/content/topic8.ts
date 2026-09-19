import type { Question } from '@/lib/game/types';

/**
 * Bộ câu hỏi Chủ đề 8 — HCM202.
 *
 * Every claim here is traceable to the course documents; `provenance` on each question
 * names the file and the line. The set was drafted from three independent angles, scored
 * by two judges, adversarially verified on two axes per question (source fidelity and
 * distractor defensibility), then repaired and independently re-checked.
 *
 * See docs/question-set.md for the reasoning, and docs/content-source.md for the content
 * map and the register of places where the source documents disagree with each other.
 *
 * `distractorRationale` is documentation for whoever runs the game. It is never sent to a
 * player — see PublicQuestion in src/lib/game/types.ts.
 */
export const TOPIC8_QUESTIONS: readonly Question[] = [
  {
    id: 'q1-pham-chat-voi-tu-minh',
    kind: 'concept-id',
    title: 'Phẩm chất với tự mình',
    prompt:
      'Tài liệu môn học gắn mỗi phẩm chất đạo đức cơ bản với một mối quan hệ. Phẩm chất nào giải quyết mối quan hệ của mỗi người với “tự mình”, gắn với hoạt động hàng ngày của từng người?',
    options: [
      { text: 'Trung với nước, hiếu với dân' },
      { text: 'Cần, kiệm, liêm, chính - chí công vô tư' },
      { text: 'Thương yêu con người, sống có tình có nghĩa' },
      { text: 'Tinh thần quốc tế trong sáng' },
    ],
    correctIndex: 1,
    explanation:
      'Tài liệu ghi: "Cần, kiệm, liêm, chính - chí công vô tư (giải quyết quan hệ mỗi người với chính mình)"; câu kế: phẩm chất này "gắn với hoạt động hàng ngày", giải quyết quan hệ với “tự mình”.',
    conceptId: 'bon-pham-chat-bon-moi-quan-he',
    conceptLabel: 'Bốn phẩm chất đạo đức cơ bản ứng với bốn mối quan hệ',
    provenance:
      'decuong-lythuyet.md, CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (tiêu đề tách hai dòng 463-464), dòng 489 nguyên văn: "2)- Cần, kiệm, liêm, chính - chí công vô tư (giải quyết quan hệ mỗi người với chính mình)."; dòng 490 nguyên văn: "Cần, kiệm, liêm, chính là phẩm chất đạo đức gắn với hoạt động hàng ngày của từng người, giải quyết mối quan hệ của mỗi người với “tự mình”." (tài liệu dùng nháy cong, đã giữ đúng dạng; tài liệu viết "hàng ngày", không phải "hằng ngày"). Khung bốn phẩm chất: dòng 484 ("- Phẩm chất đạo đức cơ bản"), bốn mục ở dòng 485, 489, 496, 501, câu cuối ở dòng 504; dòng 506 bắt đầu mục kế ("#### Biện pháp xây dựng đạo đức mới"). Chương 6 thứ hai ("PHƯƠNG PHÁP CÁCH MẠNG VÀ PHONG CÁCH HỒ CHÍ MINH") bắt đầu ở dòng 527, nên phải ghi đủ tên chương. Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 18-19 (mốc trang ở dòng 795 và 840); hai câu then chốt ở dòng 847-850; khối bốn phẩm chất kết ở dòng 881, ngay trước tiêu đề mục kế ở dòng 882. Tham chiếu song song, KHÔNG có đáp án: tracnghiem.md, CHƯƠNG VII (đầu chương dòng 1842), câu 35, dòng 2051-2055.',
    difficulty: 'de',
    durationSec: 20,
    distractorRationale:
      'Tài liệu chú đích danh ba mối quan hệ KHÁC cho ba phương án còn lại trong cùng một khung ánh xạ một-một: A được chú "(giải quyết mối quan hệ của mỗi người với đất nước mình, với nhân dân, dân tộc mình)" ở dòng 485; C được chú "(giải quyết quan hệ giữa mỗi người với người khác)" ở dòng 496; D được chú "(giải quyết mối quan hệ quốc tế)" ở dòng 501. Riêng C có thể gây phân vân vì dòng 498 cũng nhắc "quan hệ hằng ngày" và "nghiêm khắc với mình", nhưng đó là mô tả quan hệ với NGƯỜI KHÁC; cụm "tự mình" chỉ xuất hiện đúng một lần trong toàn bộ tài liệu lý thuyết, ở dòng 490, thuộc phương án B. Căn cứ chấm là TIÊU ĐỀ dòng 489 (dấu ngoặc "(giải quyết quan hệ mỗi người với chính mình)" bao trùm cả cụm "chí công vô tư"), không phải dòng 490 (chủ ngữ câu đó chỉ gồm "Cần, kiệm, liêm, chính"). Ngân hàng trắc nghiệm không có đáp án ở bất kỳ đâu nên không được dùng làm căn cứ chấm.',
  },
  {
    id: 'q2-ban-cam-ket-mot-thang',
    kind: 'scenario',
    title: 'Bản cam kết một tháng',
    prompt:
      'Sau buổi sinh hoạt về đạo đức, Minh viết cam kết và hai tuần đầu thực hiện đều: đi họp đúng giờ, nhận việc khó. Sang tháng sau, Minh không duy trì nữa. Theo Chủ đề 8, chỗ hỏng của Minh là gì?',
    options: [
      { text: 'Minh thiếu năng lực chuyên môn nên không kham nổi phần việc được giao' },
      { text: 'Nhóm chưa phân công lại nhiệm vụ nên Minh không còn việc để rèn luyện' },
      { text: 'Minh coi tu dưỡng là việc nhất thời, không rèn luyện bền bỉ suốt đời' },
      { text: 'Bản cam kết chưa đủ chi tiết nên Minh không biết rèn luyện thế nào' },
    ],
    correctIndex: 2,
    explanation:
      'Đây là nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới thứ nhất — "Tu dưỡng đạo đức suốt đời": "Mỗi người phải tự giác tu dưỡng, rèn luyện hằng ngày, bền bỉ suốt đời…"',
    conceptId: 'tu-duong-dao-duc-suot-doi',
    conceptLabel: 'Tu dưỡng đạo đức suốt đời',
    provenance:
      'decuong-lythuyet.md, CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH, dòng 506 (tiêu đề mục "#### Biện pháp xây dựng đạo đức mới"), dòng 509 ("#### 1)- Tu dưỡng đạo đức suốt đời."), dòng 510 nguyên văn ("- Mỗi người phải tự giác tu dưỡng, rèn luyện hằng ngày, bền bỉ suốt đời, gắn với thực tiễn cách mạng."), dòng 511 ("- Sự tu dưỡng phải xuất phát từ lương tâm của mỗi người…"; nguyên bản chứa lỗi gõ "mmục tiêu", "phụng sử" nên chỉ trích nửa đầu câu). Dòng đối chiếu: 512-513 thuộc mục thứ hai ("2)- Nói đi đôi với làm, nêu gương đạo đức."), 516 và 520 thuộc mục thứ ba ("#### 3)- Xây đi đôi với chống."); mục đóng lại ở dòng 522, không có mục thứ tư. Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 19 dòng 882 ("2. Biện pháp xây dựng đạo đức mới"; mốc trang ở dòng 840) và trang 20 dòng 891-896 (mốc trang ở dòng 887). Không viện dẫn ngân hàng trắc nghiệm (không có đáp án).',
    difficulty: 'trung-binh',
    durationSec: 24,
    distractorRationale:
      'Phương án A: chính tình huống đã nêu Minh thực hiện tốt trong hai tuần đầu (đi họp đúng giờ, nhận việc khó), nên chỗ hỏng không nằm ở năng lực chuyên môn mà ở chỗ buông rèn luyện; grep toàn mục 506-522 không có dòng nào quy lỗi đạo đức về năng lực chuyên môn. Phương án B đặt nguồn động lực tu dưỡng ở bên ngoài, trái dòng 510-511: "Mỗi người phải tự giác tu dưỡng…" và "Sự tu dưỡng phải xuất phát từ lương tâm của mỗi người…"; B nói về chờ tổ chức phân công nhiệm vụ, không phải việc tập thể "giáo dục lẫn nhau" mà dòng 520 đề cao, nên B không được dòng 520 bênh vực. Phương án C là đáp án: khớp trực tiếp cụm "rèn luyện hằng ngày, bền bỉ suốt đời" (dòng 510) và tên tiểu mục dòng 509. Phương án D quy vấn đề về hình thức văn bản; dòng 509-511 không đặt điều kiện nào về độ chi tiết của bản cam kết, còn ý "lấy hiệu quả làm thước đo" (dòng 513) thuộc mục thứ hai, không thuộc mục đang chấm.',
  },
  {
    id: 'q3-ba-ke-dich',
    kind: 'knowledge',
    title: 'Ba kẻ địch phải chống',
    prompt:
      'Trong mục "Xây đi đôi với chống", tài liệu môn học nêu ba kẻ địch mà cuộc đấu tranh cách mạng phải thường xuyên chống lại. Đó là ba kẻ địch nào?',
    options: [
      { text: 'Tham ô; lãng phí; quan liêu' },
      { text: 'Tụt hậu về kinh tế; tình trạng suy thoái; tình trạng tham nhũng, lãng phí' },
      { text: 'Bọn đế quốc; thói xấu kiêu ngạo, xa hoa; chủ nghĩa cá nhân' },
      { text: 'Bọn đế quốc; thói quen và truyền thống lạc hậu; chủ nghĩa cá nhân' },
    ],
    correctIndex: 3,
    explanation:
      'Nguyên văn tài liệu: "…thường xuyên phải chống lại ba kẻ địch: bọn đế quốc là kẻ địch rất nguy hiểm; thói quen và truyền thống lạc hậu cũng là kẻ địch to; chủ nghĩa cá nhân."',
    conceptId: 'ba-ke-dich',
    conceptLabel: 'Ba kẻ địch phải thường xuyên chống lại',
    provenance:
      'decuong-lythuyet.md, CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (tiêu đề dòng 463-464), dòng 506 ("#### Biện pháp xây dựng đạo đức mới"), dòng 516 ("#### 3)- Xây đi đôi với chống." — mục thứ ba trong đúng ba mục được đánh số), dòng 518 (câu ba kẻ địch, nguyên văn đầy đủ). Chất liệu phương án nhiễu: dòng 517 ("…chưa bỏ hết những thói xấu tự tư tự lợi, kiêu ngạo, xa hoa…") và dòng 613 (danh mục nguy cơ, thuộc chương "PHƯƠNG PHÁP CÁCH MẠNG VÀ PHONG CÁCH HỒ CHÍ MINH" bắt đầu ở dòng 527, KHÔNG thuộc chương đạo đức). Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 20 (mốc "===== [PDF PAGE 20] =====" ở dòng 887), dòng 906-908. Bối cảnh từ ngân hàng KHÔNG có đáp án: tracnghiem.md, CHƯƠNG VI (đầu chương dòng 1596), câu 29 dòng 1770-1774 và câu 33 dòng 1794-1798 (CHƯƠNG VII, chương đạo đức, mới bắt đầu ở dòng 1842).',
    difficulty: 'trung-binh',
    durationSec: 20,
    distractorRationale:
      'A "Tham ô; lãng phí; quan liêu": hai tài liệu lý thuyết không chỗ nào gọi bộ ba này là kẻ địch (grep "tham ô" trên decuong-lythuyet.md trả về 0 kết quả); nó chỉ xuất hiện trong ngân hàng trắc nghiệm, ở hai câu thuộc CHƯƠNG VI (phần nhà nước — chương đạo đức là CHƯƠNG VII, bắt đầu ở dòng 1842): phương án B của câu 29 (tracnghiem.md dòng 1770-1774), hỏi về "căn bệnh nào của cán bộ, công chức" được ví là "giặc nội xâm, là bạn đồng minh của thực dân, phong kiến"; và phương án C của câu 33 (dòng 1794-1798), hỏi về "những hành động dẫn đến gây mất đoàn kết, gây rối cho công tác của bộ máy nhà nước". Cả hai câu đều KHÔNG có đáp án, vì vậy tuyệt đối không được khẳng định bộ ba này là đáp án của bất kỳ câu nào (phương án D của chính câu 29 là "Chủ nghĩa cá nhân"). Điều chắc chắn: cụm "giặc nội xâm" chỉ xuất hiện đúng một lần trong toàn kho, ở tracnghiem.md dòng 1770, và không có ở bất kỳ đâu trong hai tài liệu lý thuyết. B: bản RÚT GỌN danh mục nguy cơ ở dòng 613 ("tụt hậu ngày càng xa hơn về kinh tế; tình trạng suy thoái; tình trạng tham nhũng, lãng phí, quan liêu..."), không phải trích nguyên văn, và đoạn đó thuộc chương phương pháp - phong cách chứ không thuộc CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH; "nguy cơ" không phải "kẻ địch". C: giữ đúng kẻ địch thứ nhất và thứ ba nhưng thay kẻ địch thứ hai bằng chất liệu lấy từ gạch đầu dòng MÔ TẢ liền trước (dòng 517). Đây là bẫy chính: nhầm đoạn mô tả khuyết điểm đảng viên với danh mục ba kẻ địch ở dòng 518, và bỏ mất thứ mà tài liệu gọi đích danh là "kẻ địch to". D là đáp án đúng: khớp từng chữ và đúng thứ tự của dòng 518.',
  },
  {
    id: 'q4-ban-nhan-loi-va-sua',
    kind: 'scenario',
    title: 'Bạn nhận lỗi và sửa',
    prompt:
      'Một thành viên làm sai toàn bộ phần số liệu, đã nhận lỗi trước cả nhóm và xin làm lại; thời hạn vẫn còn kịp. Theo tư tưởng đạo đức Hồ Chí Minh ở Chủ đề 8, nhóm nên làm gì?',
    options: [
      { text: 'Cho bạn tự sửa lại và chỉ rõ chỗ sai để cùng rút kinh nghiệm' },
      { text: 'Loại bạn khỏi nhóm để giữ điểm chung cho cả nhóm' },
      { text: 'Bỏ qua, không cần sửa lại số liệu nữa, để giữ hoà khí' },
      { text: 'Nghiêm khắc với bạn nhưng rộng rãi với chính mình khi mắc lỗi tương tự' },
    ],
    correctIndex: 0,
    explanation:
      'Tài liệu: yêu thương cả người "có sai lầm, khuyết điểm, nhưng đã nhận rõ khuyết điểm, sai lầm và cố gắng sửa chữa"; chỉ rõ chỗ sai là tinh thần "xây đi đôi với chống".',
    conceptId: 'thuong-yeu-con-nguoi-song-co-tinh-co-nghia',
    conceptLabel: 'Thương yêu con người, sống có tình có nghĩa',
    provenance:
      'decuong-lythuyet.md, CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (tiêu đề dòng 463-464), mục "3)- Thương yêu con người, sống có tình có nghĩa" ở dòng 496-500; trọng tâm là dòng 499 nguyên văn ("- Tình yêu thương con người, còn được thể hiện đối với những người có sai lầm, khuyết điểm, nhưng đã nhận rõ khuyết điểm, sai lầm và cố gắng sửa chữa."), kèm dòng 498 ("…chặt chẽ, nghiêm khắc với mình, rộng rãi, độ lượng với người khác.") và dòng 500 ("phải có tình đồng chí thương yêu lẫn nhau", phát biểu cho "cán bộ, đảng viên" — áp vào nhóm học tập là một bước vận dụng); dòng 495 dùng để bác phương án B. Vế "chỉ rõ chỗ sai" mượn từ dòng 516 và dòng 520, thuộc nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới, tiêu đề ở dòng 506. Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 19 (mốc trang ở dòng 840, trang 20 bắt đầu ở dòng 887), dòng 864-875, câu then chốt ngắt dòng ở 872-873. Không viện dẫn ngân hàng trắc nghiệm (không có đáp án).',
    difficulty: 'trung-binh',
    durationSec: 22,
    distractorRationale:
      'Phương án A là đáp án: dòng 499 nêu nguyên văn tình yêu thương con người "còn được thể hiện đối với những người có sai lầm, khuyết điểm, nhưng đã nhận rõ khuyết điểm, sai lầm và cố gắng sửa chữa" — bạn trong tình huống hội đủ cả hai vế (đã nhận lỗi, xin làm lại), và thời hạn còn kịp nên việc sửa là khả thi. Vế "chỉ rõ chỗ sai để cùng rút kinh nghiệm" là luận cứ MƯỢN từ mục "3)- Xây đi đôi với chống" (dòng 516) thuộc nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới: "Chống và xây phải đi liền với nhau. Lấy gương người tốt việc tốt hàng ngày giáo dục lẫn nhau…" (dòng 520); đây không phải nội dung của phần phẩm chất, và cụm "chỉ rõ chỗ sai" là diễn đạt vận dụng, không phải trích dẫn. Phương án B loại bỏ đúng đối tượng mà dòng 499 yêu cầu phải thương yêu, và trái lời căn dặn ở dòng 500. Lập luận "vì lợi ích chung" nghe như dựa vào chí công vô tư nhưng đọc sai tài liệu: dòng 495 viết "Chí công vô tư là khi làm bất cứ việc gì đừng nghĩ đến mình trước, khi hưởng thụ thì mình nên đi sau" — tức hy sinh lợi ích CỦA CHÍNH MÌNH, chứ không cho phép lấy lợi ích tập thể làm lý do gạt bỏ một người đã nhận rõ lỗi và xin sửa. Phương án C tước mất đúng điều kiện thứ hai mà dòng 499 đặt ra là "cố gắng sửa chữa"; độ lượng theo dòng 498 là "rộng rãi, độ lượng với người khác", không phải miễn luôn việc sửa sai, và bỏ hẳn việc sửa cũng là chỉ xây mà bỏ chống (dòng 520). Phương án D lật ngược chính xác yêu cầu nguyên văn ở dòng 498.',
  },
  {
    id: 'q5-ba-nguyen-tac',
    kind: 'knowledge',
    title: 'Ba nguyên tắc — tài liệu gọi là "biện pháp"',
    prompt:
      'Trong Đề cương tóm tắt môn học, mục nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới chỉ đánh số đúng ba nội dung. Nội dung nào sau đây KHÔNG nằm trong ba nội dung đó?',
    options: [
      { text: 'Nói đi đôi với làm, nêu gương đạo đức' },
      { text: 'Tự phê bình và phê bình' },
      { text: 'Xây đi đôi với chống' },
      { text: 'Tu dưỡng đạo đức suốt đời' },
    ],
    correctIndex: 1,
    explanation:
      'Phần "Biện pháp xây dựng đạo đức mới" chỉ đánh số ba mục: tu dưỡng suốt đời; nói đi đôi với làm, nêu gương; xây đi đôi với chống. Tự phê bình và phê bình không thuộc mục này.',
    conceptId: 'bien-phap-xay-dung-dao-duc-moi',
    conceptLabel: 'Biện pháp xây dựng đạo đức mới (ở mục này tài liệu không dùng chữ "nguyên tắc")',
    provenance:
      'decuong-lythuyet.md (tài liệu tự xưng "ĐỀ CƯƠNG TÓM TẮT / HCM202" ở đầu file), CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (tiêu đề tách hai dòng 463-464), dòng 506 ("#### Biện pháp xây dựng đạo đức mới"); đúng ba mục đánh số ở dòng 509 ("#### 1)- Tu dưỡng đạo đức suốt đời."), dòng 512 ("2)- Nói đi đôi với làm, nêu gương đạo đức.") và dòng 516 ("#### 3)- Xây đi đôi với chống."); mục kết thúc tại dòng 522, nơi bắt đầu phần "HỌC TẬP VÀ LÀM THEO…" — không có mục thứ tư. Tôi đã grep "phê bình" và "nguyên tắc" trên toàn khối 463-522: KHÔNG dòng nào chứa hai cụm đó. LƯU Ý TRÍCH XUẤT: dòng 509 và 516 có tiền tố Markdown "#### ", dòng 512 thì không, nên đếm bằng grep "^####" sẽ ra hai mục thay vì ba. Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 19 dòng 882 (mốc trang ở dòng 840) và trang 20 dòng 891, 897, 902, thân mục hết ở dòng 917, dòng 918 sang phần III (mốc trang 20 ở dòng 887). Bối cảnh của "tự phê bình và phê bình", KHÔNG dùng làm căn cứ loại trừ: decuong-lythuyet.md dòng 295-296 (cụm "những nguyên tắc của một Đảng Mácxit-lêninnít" nằm cuối dòng 295, danh sách nối sang dòng 296), dòng 312-314 ("- Xây dựng đảng về tổ chức:" / "+ Nguyên tắc tự phê bình và phê bình.") và dòng 395, tất cả thuộc CHƯƠNG 4 (tiêu đề dòng 283; đối chứng PDF dòng 602); dòng 308 ("- Xây phải đi liền với chống, lấy xây để chống.") cũng thuộc CHƯƠNG 4. Bộ phương án lấy từ tracnghiem.md, CHƯƠNG VII (tiêu đề dòng 1842), câu 39, dòng 2075-2079 — chỉ dùng làm NGUỒN PHƯƠNG ÁN, tuyệt đối không dùng làm nguồn đáp án vì ngân hàng này không có đáp án ở bất kỳ đâu.',
    difficulty: 'trung-binh',
    durationSec: 22,
    distractorRationale:
      'A ("Nói đi đôi với làm, nêu gương đạo đức"), C ("Xây đi đôi với chống") và D ("Tu dưỡng đạo đức suốt đời") không thể chọn cho đề bài dạng phủ định vì cả ba là nhãn nguyên văn của ba mục được đánh số trong mục "Biện pháp xây dựng đạo đức mới": D = dòng 509, A = dòng 512, C = dòng 516. B ("Tự phê bình và phê bình") là đáp án THUẦN TÚY THEO PHÉP ĐẾM: mục đóng lại ở ba nội dung được đánh số (dòng 522 đã sang phần khác), nên B không nằm trong đó. CẢNH BÁO CHO NGƯỜI SOẠN — KHÔNG được giải thích bằng tiêu chí vị trí chương ("vì nó nằm ở phần xây dựng Đảng"): tiêu chí đó không phân biệt được, bởi chính "Xây phải đi liền với chống, lấy xây để chống" cũng xuất hiện ở CHƯƠNG 4, dòng 308; sinh viên áp dụng đúng tiêu chí ấy sẽ chọn C. Căn cứ duy nhất đứng vững là phép đếm ba mục được đánh số trong CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH. Văn bản phương án B dùng trật tự "tự phê bình và phê bình" đúng như đề cương lý thuyết (dòng 296, 314, 395), không dùng trật tự "Phê bình và tự phê bình" của ngân hàng trắc nghiệm, để lời giải và phương án cùng một nguồn. Nếu có sinh viên phản bác bằng tracnghiem.md câu 39 (dòng 2075-2079) — vốn hỏi về "nguyên tắc quan trọng bậc nhất trong xây dựng đạo đức mới" và liệt kê "Phê bình và tự phê bình" làm phương án D — giảng viên trả lời: ngân hàng đó KHÔNG có đáp án, và đề bài ở đây đã giới hạn rõ phạm vi vào Đề cương tóm tắt môn học.',
  },
  {
    id: 'q6-quy-nhom-xung-dot-loi-ich',
    kind: 'scenario',
    title: 'Quỹ nhóm và chỗ quen',
    prompt:
      'Bạn giữ quỹ nhóm để đi in tài liệu. Tiệm in của người thân bạn báo giá cao hơn nơi khác nhưng hứa chia lại riêng cho bạn một khoản. Bạn chọn cách xử lý nào?',
    options: [
      { text: 'Chọn tiệm của người thân, vì giúp người quen cũng là thương yêu con người' },
      { text: 'Nhận khoản chia lại rồi mua nước cho cả nhóm, coi như đã hoàn lại' },
      { text: 'Giữ kín quan hệ người thân và chọn tiệm đó, vì mức chênh lệch không nhiều' },
      { text: 'Từ chối khoản chia lại, nói rõ quan hệ người thân, để nhóm tự quyết định' },
    ],
    correctIndex: 3,
    explanation:
      'Quỹ nhóm là của chung. Liêm: "giữ gìn của công… không tham lam"; Chính: "thẳng thắn, đứng đắn"; chí công vô tư: "đừng nghĩ đến mình trước". Phải từ chối khoản riêng, công khai quan hệ.',
    conceptId: 'can-kiem-liem-chinh-chi-cong-vo-tu',
    conceptLabel: 'Cần, kiệm, liêm, chính - chí công vô tư',
    provenance:
      'decuong-lythuyet.md, CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (tiêu đề dòng 463-464), dòng 489-490 (tài liệu gộp "Cần, kiệm, liêm, chính - chí công vô tư" thành MỘT phẩm chất, giải quyết quan hệ của mỗi người với "tự mình"); dòng 493 nguyên văn ("- Liêm tức là luôn luôn tôn trọng giữ gìn của công và của dân; phải trong sạch, không tham lam, không tham địa vị."); dòng 494 nguyên văn ("- Chính nghĩa là không tà, nghĩa là thẳng thắn, đứng đắn."); dòng 495 (đoạn chí công vô tư, chứa "khi làm bất cứ việc gì đừng nghĩ đến mình trước, khi hưởng thụ thì mình nên đi sau"); dòng 496-498 (mục "Thương yêu con người", dùng để bác phương án A). Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 19 (mốc "[PDF PAGE 19]" ở dòng 840, "[PDF PAGE 20]" ở dòng 887), dòng 847-850 (gộp một phẩm chất), 856-857 (Liêm), 858 (Chính), 859-863 (chí công vô tư), 866-868 và 869-871 (Thương yêu con người). Tất cả số dòng trên đều đã được mở và đối chiếu trực tiếp. Ngân hàng trắc nghiệm KHÔNG có đáp án và không có câu nào về xung đột lợi ích, nên câu hỏi này không dựa vào ngân hàng.',
    difficulty: 'trung-binh',
    durationSec: 26,
    distractorRationale:
      'A ("giúp người quen cũng là thương yêu con người") đánh tráo phẩm chất: tài liệu xếp "Thương yêu con người, sống có tình có nghĩa" vào nhóm "giải quyết quan hệ giữa mỗi người với người khác" (dòng 496), thể hiện ở ham muốn tột bậc "ai cũng có cơm ăn áo mặc, ai cũng được học hành" (dòng 497), và ở dạng gần tình huống nhất là trong "mối quan hệ bạn bè, đồng chí, với mọi người bình thường trong quan hệ hằng ngày", nhưng kèm đòi hỏi "nghiêm khắc với mình, rộng rãi, độ lượng với người khác" (dòng 498) — tức nghiêm với mình trước, chứ không phải nới tay cho người quen bằng tiền của nhóm. B (nhận khoản chia lại rồi mua nước cho nhóm) vẫn là lấy của chung sinh lợi riêng rồi ban phát lại: trái chữ Liêm, "luôn luôn tôn trọng giữ gìn của công và của dân; phải trong sạch, không tham lam" (dòng 493); hoàn lại bằng chai nước không xoá được việc nhóm đã phải chịu giá cao hơn. C (giấu quan hệ vì mức chênh lệch không nhiều) sai ở chữ Chính: tài liệu viết "Chính nghĩa là không tà, nghĩa là thẳng thắn, đứng đắn" (dòng 494) — đây là câu định nghĩa chữ "Chính", không phải từ ghép "chính nghĩa"; giấu xung đột lợi ích là không thẳng thắn, bất kể mức chênh lệch. D là đáp án vì xử lý cả ba vế: từ chối khoản riêng (Liêm, dòng 493), công khai quan hệ (Chính, dòng 494), và không nghĩ đến mình trước (chí công vô tư, dòng 495). Lưu ý cho giảng viên: tài liệu gộp "Cần, kiệm, liêm, chính - chí công vô tư" thành MỘT phẩm chất (dòng 489-490), nên việc đáp án được chống đỡ bởi cả ba chữ là đúng với cách phân nhóm của tài liệu; và quỹ nhóm sinh viên không phải "của công, của dân" theo nghĩa đen — đây là bước liên hệ, vận dụng, cần nói rõ khi chữa bài.',
  },
  {
    id: 'q7-xay-di-doi-voi-chong',
    kind: 'knowledge',
    title: 'Xây và chống, cái nào chủ yếu',
    prompt:
      'Nhóm bạn vừa phát hiện một thành viên ghi khống phần việc trong bảng phân công. Theo tài liệu môn học, quan hệ giữa “chống” và “xây” phải được hiểu thế nào?',
    options: [
      { text: 'Chống mới là nhiệm vụ chủ yếu và lâu dài, còn xây chỉ là kết quả đi kèm' },
      { text: 'Xử lý xong sai phạm thì coi như đã hoàn thành phần việc xây dựng đạo đức' },
      { text: 'Chống cũng nhằm xây, đi liền với xây nhưng xây là nhiệm vụ chủ yếu và lâu dài' },
      { text: 'Xây và chống là hai việc tách rời, làm xong việc này mới tới việc kia' },
    ],
    correctIndex: 2,
    explanation:
      'Nguyên văn tài liệu: "Chống cũng nhằm xây, đi liền với xây nhưng xây là nhiệm vụ chủ yếu và lâu dài, để kiến tạo một nền đạo đức mới ở Việt Nam…"',
    conceptId: 'xay-di-doi-voi-chong',
    conceptLabel: 'Xây đi đôi với chống',
    provenance:
      'decuong-lythuyet.md, CHƯƠNG 6: TƯ TƯỞNG ĐẠO ĐỨC HỒ CHÍ MINH (tiêu đề dòng 463-464), thuộc mục nguyên tắc (tài liệu gọi là "biện pháp") xây dựng đạo đức mới: tiêu đề "#### Biện pháp xây dựng đạo đức mới" ở dòng 506, tiểu mục "#### 3)- Xây đi đôi với chống." ở dòng 516. Câu chốt, dòng 521 nguyên văn trọn câu: "- Chống cũng nhằm xây, đi liền với xây nhưng xây là nhiệm vụ chủ yếu và lâu dài, để kiến tạo một nền đạo đức mới ở Việt Nam, xây dựng một xã hội mới với những con người có đạo đức." (nguyên văn KHÔNG có dấu phẩy trước "nhưng"). Dòng 520 nguyên văn trọn câu: "- Chống và xây phải đi liền với nhau. Lấy gương người tốt việc tốt hàng ngày giáo dục lẫn nhau là một trong những cách tốt nhất để xây dựng Đảng, xây dựng các tổ chức cách mạng, xây dựng con người mới, cuộc sống mới." Dòng 518, trích một phần: "…chúng ta thường xuyên phải chống lại ba kẻ địch…". Bản xuất PDF của CÙNG tài liệu, không phải nguồn độc lập: decuong-tthcm-pdf.md, trang 20 (mốc "===== [PDF PAGE 20] =====" ở dòng 887, trang 21 ở dòng 934), hai câu trên ở dòng 912-914 và 915-917. Không dựa vào bất kỳ đáp án nào của tracnghiem.md (ngân hàng đó không có đáp án; câu 39 ở dòng 2075-2079 hỏi việc khác).',
    difficulty: 'kho',
    durationSec: 28,
    distractorRationale:
      'Phương án A đảo ngược đúng thứ bậc mà tài liệu khẳng định: dòng 521 đặt XÂY — không phải chống — ở vị trí "nhiệm vụ chủ yếu và lâu dài", nên A sai ngay ở cụm từ then chốt dù nghe rất xuôi tai ngay sau khi nhóm vừa phát hiện một sai phạm. Đây là nhiễu mạnh nhất của cả bộ. Phương án B coi xây là việc làm một lần, kết thúc cùng lúc với việc xử lý sai phạm; trái chữ "lâu dài" ở dòng 521 và trái cách làm thường xuyên mà dòng 520 nêu ("Lấy gương người tốt việc tốt hàng ngày giáo dục lẫn nhau"). Phương án C là đáp án, giữ trọn cụm "nhiệm vụ chủ yếu và lâu dài" của dòng 521 và cắt đúng ranh giới mệnh đề. Phương án D tách rời hai vế, trái "Chống và xây phải đi liền với nhau" (dòng 520) và "đi liền với xây" (dòng 521); thêm nữa dòng 518 nói "thường xuyên phải chống", nên chống không phải một việc làm xong rồi thôi. Không phương án nhiễu nào có chỗ dựa trong tài liệu: grep "chủ yếu và lâu dài" trên toàn kho chỉ ra hai lần, đều là cùng câu này ở hai bản xuất, và đều đặt xây ở vị trí chủ yếu; không chỗ nào xếp "chống" lên trên "xây".',
  },
];
