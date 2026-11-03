import { QueueItem } from '../types';
import { formatQueueTime, formatQueueDate, formatTimestampToTime, getCanonicalThaiDate, getCanonicalThaiTime } from './time';

interface ExportWordOptions {
  categoryLabel?: string;
  statusLabel?: string;
  dateLabel?: string;
  totalIssued: number;
  completedCount: number;
  waitingCount: number;
  calledCount: number;
  skippedCount: number;
}

/**
 * Exports queue report data to a formatted Microsoft Word document (.doc).
 * Uses UTF-8 encoded MSO-compliant HTML table structure that opens seamlessly
 * in Microsoft Word, WPS Office, and LibreOffice with Thai typography support.
 */
/**
 * Generates the Word document HTML content.
 */
export function buildWordDocumentHtml(
  queues: QueueItem[],
  options: ExportWordOptions
): string {
  const printDateStr = getCanonicalThaiDate();
  const printTimeStr = getCanonicalThaiTime();

  let rowsHtml = '';
  queues.forEach((q, idx) => {
    const statusText =
      q.status === 'waiting' ? 'รอเรียกคิว' :
      q.status === 'called' ? 'กำลังรับบริการ' :
      q.status === 'completed' ? 'เสร็จสิ้นบริการ' : 'ข้ามคิว';

    const calledTime = q.calledAt ? formatTimestampToTime(q.calledAt) : '-';
    const completedTime = q.completedAt ? formatTimestampToTime(q.completedAt) : '-';

    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    rowsHtml += `
      <tr style="background-color: ${rowBg};">
        <td style="text-align: center; border: 1px solid #475569; padding: 6px;">${idx + 1}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #475569; padding: 6px; color: #1e3a8a;">${q.ticketNumber}</td>
        <td style="border: 1px solid #475569; padding: 6px;">${q.categoryName}</td>
        <td style="text-align: center; border: 1px solid #475569; padding: 6px;">${q.counterLabel ? q.counterLabel : q.counter ? 'ช่อง #' + q.counter : '-'}</td>
        <td style="text-align: center; border: 1px solid #475569; padding: 6px;">${formatQueueDate(q)} ${formatQueueTime(q)} น.</td>
        <td style="text-align: center; border: 1px solid #475569; padding: 6px;">${calledTime !== '-' ? calledTime + ' น.' : '-'}</td>
        <td style="text-align: center; border: 1px solid #475569; padding: 6px;">${completedTime !== '-' ? completedTime + ' น.' : '-'}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #475569; padding: 6px;">${statusText}</td>
      </tr>
    `;
  });

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>รายงานสถิติและประวัติการให้บริการคิว</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 210mm 297mm; /* A4 */
      margin: 20mm 15mm 20mm 15mm;
      mso-header-margin: 10mm;
      mso-footer-margin: 10mm;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'TH Sarabun PSK', 'Sarabun', 'Cordia New', Tahoma, sans-serif;
      font-size: 15pt;
      line-height: 1.35;
      color: #000000;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .title-large {
      font-size: 19pt;
      font-weight: bold;
      text-align: center;
      margin: 0;
    }
    .title-sub {
      font-size: 15pt;
      text-align: center;
      margin-top: 3px;
      margin-bottom: 12px;
      color: #1e293b;
    }
    .meta-box {
      font-size: 13pt;
      margin-bottom: 15px;
      padding: 8px 12px;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
    }
    .kpi-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .kpi-cell {
      border: 1px solid #94a3b8;
      padding: 8px 4px;
      text-align: center;
      background-color: #f8fafc;
      font-size: 13pt;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .data-table th {
      background-color: #1e3a8a;
      color: #ffffff;
      font-weight: bold;
      font-size: 13pt;
      border: 1px solid #0f172a;
      padding: 8px 5px;
      text-align: center;
    }
    .sign-section {
      margin-top: 35px;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <div class="title-large">รายงานสรุปสถิติและประวัติการให้บริการคิวประชาชน</div>
    <div class="title-sub">สำนักงานจัดหางานจังหวัดสุพรรณบุรี กรมการจัดหางาน กระทรวงแรงงาน</div>

    <div class="meta-box">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="border: none; font-size: 13pt;"><strong>ช่วงเวลา/วันที่:</strong> ${options.dateLabel || 'ทั้งหมด'}</td>
          <td style="border: none; font-size: 13pt; text-align: right;"><strong>พิมพ์เมื่อ:</strong> ${printDateStr} เวลา ${printTimeStr} น.</td>
        </tr>
        <tr>
          <td style="border: none; font-size: 13pt;"><strong>หมวดหมู่งาน:</strong> ${options.categoryLabel || 'ทั้งหมด'}</td>
          <td style="border: none; font-size: 13pt; text-align: right;"><strong>สถานะ:</strong> ${options.statusLabel || 'ทั้งหมด'} (${queues.length} รายการ)</td>
        </tr>
      </table>
    </div>

    <!-- Summary KPI Table -->
    <table class="kpi-table">
      <tr>
        <td class="kpi-cell"><strong>คิวที่ออกทั้งหมด</strong><br><span style="font-size: 17pt; font-weight: bold; color: #0f172a;">${options.totalIssued}</span> ฉบับ</td>
        <td class="kpi-cell"><strong>เสร็จสิ้นบริการ</strong><br><span style="font-size: 17pt; font-weight: bold; color: #166534;">${options.completedCount}</span> คิว</td>
        <td class="kpi-cell"><strong>กำลังให้บริการ</strong><br><span style="font-size: 17pt; font-weight: bold; color: #1e40af;">${options.calledCount}</span> คิว</td>
        <td class="kpi-cell"><strong>รอเรียกรับบริการ</strong><br><span style="font-size: 17pt; font-weight: bold; color: #b45309;">${options.waitingCount}</span> คิว</td>
        <td class="kpi-cell"><strong>ข้ามคิว</strong><br><span style="font-size: 17pt; font-weight: bold; color: #dc2626;">${options.skippedCount}</span> คิว</td>
      </tr>
    </table>

    <!-- Detailed Records Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 12%;">เลขคิว</th>
          <th style="width: 28%;">ประเภทงานบริการ</th>
          <th style="width: 11%;">ช่องบริการ</th>
          <th style="width: 14%;">เวลากดคิว</th>
          <th style="width: 10%;">เริ่มเรียก</th>
          <th style="width: 10%;">เสร็จสิ้น</th>
          <th style="width: 10%;">สถานะ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px;">ไม่พบข้อมูลรายการ</td></tr>'}
      </tbody>
    </table>

    <!-- Official Signature Block -->
    <table class="sign-section" style="border: none;">
      <tr>
        <td style="width: 50%; border: none;"></td>
        <td style="width: 50%; border: none; text-align: center; font-size: 14pt;">
          <br><br>
          ลงชื่อ....................................................................ผู้จัดทำรายงาน<br>
          (....................................................................)<br>
          ตำแหน่ง....................................................................<br>
          วันที่ ${printDateStr}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

/**
 * Exports queue report data to a formatted Microsoft Word document (.doc).
 * Uses UTF-8 encoded MSO-compliant HTML table structure that opens seamlessly
 * in Microsoft Word, WPS Office, and LibreOffice with Thai typography support.
 */
export function exportReportToWord(
  queues: QueueItem[],
  options: ExportWordOptions
): void {
  const wordHtml = buildWordDocumentHtml(queues, options);

  // Create Blob and trigger download as .doc file
  const blob = new Blob(['\uFEFF', wordHtml], { 
    type: 'application/msword;charset=utf-8;' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileDate = new Date().toISOString().slice(0, 10);
  link.download = `รายงานคิว_จัดหางานสุพรรณบุรี_${fileDate}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
