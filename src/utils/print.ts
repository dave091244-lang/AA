import { QueueItem } from '../types';
import { formatQueueTime, formatQueueDate, formatTimestampToTime, getCanonicalThaiDate, getCanonicalThaiTime } from './time';

/**
 * Dedicated thermal slip printer utility for Kiosks and Service Counters.
 * Supports standard thermal POS printers (80mm & 58mm) and standard A4/Letter printers.
 */
export function printTicketThermal(
  ticket: QueueItem,
  queuesAhead = 0,
  estimatedWaitMin = 5
): void {
  const iframeId = '__kiosk_thermal_print_frame__';
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const dateStr = formatQueueDate(ticket);
  const timeStr = formatQueueTime(ticket);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>บัตรคิว - ${ticket.ticketNumber}</title>
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Sarabun', 'Prompt', Tahoma, -apple-system, BlinkMacSystemFont, sans-serif;
      width: 78mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 12px 10px;
      color: #000000;
      background: #ffffff;
      text-align: center;
      line-height: 1.3;
    }
    .header {
      padding-bottom: 8px;
      border-bottom: 1.5px dashed #000000;
      margin-bottom: 8px;
    }
    .logo-img {
      width: 54px;
      height: 54px;
      margin: 0 auto 6px auto;
      display: block;
      object-fit: contain;
    }
    .org-title {
      font-size: 13.5px;
      font-weight: 800;
      margin-bottom: 2px;
    }
    .org-sub {
      font-size: 10px;
      font-weight: 500;
      color: #333333;
    }
    .cat-box {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 8px;
      border: 1px solid #000000;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .ticket-section {
      padding: 10px 0;
    }
    .ticket-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ticket-number {
      font-size: 52px;
      font-weight: 900;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 2px;
      line-height: 1.1;
      margin: 4px 0;
    }
    .timestamp {
      font-size: 11px;
      font-weight: 600;
      margin-top: 2px;
    }
    .info-box {
      border: 1px solid #000000;
      border-radius: 6px;
      padding: 6px;
      margin: 8px 0;
      display: flex;
      justify-content: space-around;
      font-size: 11px;
    }
    .info-col {
      text-align: center;
      flex: 1;
    }
    .info-col:first-child {
      border-right: 1px dashed #666666;
    }
    .info-num {
      font-size: 16px;
      font-weight: 800;
    }
    .footer {
      border-top: 1.5px dashed #000000;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 9.5px;
      color: #444444;
    }
    .cut-line {
      margin-top: 12px;
      border-bottom: 1px dotted #999999;
      font-size: 8px;
      color: #999999;
      padding-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/doe_th_logo_RGB.png" alt="โลโก้" class="logo-img" />
    <div class="org-title">สำนักงานจัดหางานจังหวัดสุพรรณบุรี</div>
    <div class="org-sub">กรมการจัดหางาน กระทรวงแรงงาน</div>
    <div class="cat-box">${ticket.categoryName}</div>
  </div>

  <div class="ticket-section">
    <div class="ticket-label">หมายเลขคิวของท่าน</div>
    <div class="ticket-number">${ticket.ticketNumber}</div>
    <div class="timestamp">วันที่ ${dateStr} เวลา ${timeStr} น.</div>
  </div>

  <div class="info-box">
    <div class="info-col">
      <div>รอข้างหน้า</div>
      <div class="info-num">${queuesAhead} คิว</div>
    </div>
    <div class="info-col">
      <div>ประมาณเวลารอ</div>
      <div class="info-num">~${estimatedWaitMin} นาที</div>
    </div>
  </div>

  <div class="footer">
    <div>โปรดรอเรียกคิว ณ จุดพักคอย</div>
    <div>จอแสดงผลและเสียงประกาศจะแจ้งเมื่อถึงคิวของท่าน</div>
    <div>ขอบคุณที่ใช้บริการ</div>
  </div>

  <div class="cut-line">- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>
</body>
</html>
  `;

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      const triggerPrint = () => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch {
          window.print();
        }
      };

      const img = doc.querySelector('img');
      if (img) {
        if (img.complete) {
          setTimeout(triggerPrint, 150);
        } else {
          img.onload = () => setTimeout(triggerPrint, 100);
          img.onerror = () => setTimeout(triggerPrint, 100);
          setTimeout(triggerPrint, 800);
        }
      } else {
        setTimeout(triggerPrint, 200);
      }
    } else {
      window.print();
    }
  } catch (err) {
    console.warn('Thermal print frame error, falling back to window.print():', err);
    window.print();
  }
}

interface PrintReportOptions {
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
 * Dedicated A4 Report printer utility.
 * Guarantees that the report is printed cleanly without blank pages or UI navigation clutter.
 */
export function printOfficialReport(
  queues: QueueItem[],
  options: PrintReportOptions
): void {
  const iframeId = '__report_a4_print_frame__';
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

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

    rowsHtml += `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${q.ticketNumber}</td>
        <td>${q.categoryName}</td>
        <td style="text-align: center;">${q.counterLabel ? q.counterLabel : q.counter ? 'ช่อง #' + q.counter : '-'}</td>
        <td style="text-align: center;">${formatQueueDate(q)} ${formatQueueTime(q)} น.</td>
        <td style="text-align: center;">${calledTime !== '-' ? calledTime + ' น.' : '-'}</td>
        <td style="text-align: center;">${completedTime !== '-' ? completedTime + ' น.' : '-'}</td>
        <td style="text-align: center; font-weight: bold;">${statusText}</td>
      </tr>
    `;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>รายงานสถิติและประวัติการให้บริการคิว</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Sarabun', 'Prompt', Tahoma, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      padding: 10px;
    }
    .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    .logo { width: 55px; height: 55px; margin: 0 auto 4px auto; display: block; object-fit: contain; }
    .title { font-size: 15pt; font-weight: 800; margin-bottom: 2px; }
    .sub { font-size: 11pt; color: #222; }
    .meta { font-size: 9.5pt; color: #444; margin-top: 6px; display: flex; justify-content: space-between; border-top: 1px dashed #ccc; padding-top: 4px; }
    .kpi-row { display: flex; gap: 8px; margin: 12px 0; }
    .kpi-box { flex: 1; border: 1px solid #333; border-radius: 4px; padding: 6px; text-align: center; font-size: 9pt; background: #fafafa; }
    .kpi-num { font-size: 15pt; font-weight: 800; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
    th { background: #f1f5f9; border: 1px solid #333; padding: 6px 4px; font-weight: 700; text-align: center; }
    td { border: 1px solid #444; padding: 5px 6px; }
    .footer { margin-top: 30px; text-align: right; font-size: 10pt; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <img src="/doe_th_logo_RGB.png" alt="โลโก้" class="logo" />
    <div class="title">รายงานสรุปสถิติและประวัติการให้บริการคิวประชาชน</div>
    <div class="sub">สำนักงานจัดหางานจังหวัดสุพรรณบุรี กรมการจัดหางาน กระทรวงแรงงาน</div>
    <div class="meta">
      <span>ช่วงเวลา: <strong>${options.dateLabel || 'ทั้งหมด'}</strong> | หมวดงาน: <strong>${options.categoryLabel || 'ทั้งหมด'}</strong></span>
      <span>พิมพ์เมื่อ: ${printDateStr} เวลา ${printTimeStr} น. (รวม ${queues.length} รายการ)</span>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box">ออกคิวทั้งหมด<div class="kpi-num">${options.totalIssued}</div></div>
    <div class="kpi-box">เสร็จสิ้นบริการ<div class="kpi-num" style="color: #166534;">${options.completedCount}</div></div>
    <div class="kpi-box">กำลังให้บริการ<div class="kpi-num" style="color: #1e40af;">${options.calledCount}</div></div>
    <div class="kpi-box">รอเรียกบริการ<div class="kpi-num" style="color: #b45309;">${options.waitingCount}</div></div>
    <div class="kpi-box">ข้ามคิว<div class="kpi-num" style="color: #dc2626;">${options.skippedCount}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 12%;">เลขคิว</th>
        <th style="width: 28%;">ประเภทงานบริการ</th>
        <th style="width: 10%;">ช่อง</th>
        <th style="width: 17%;">เวลากดคิว</th>
        <th style="width: 10%;">เริ่มเรียก</th>
        <th style="width: 10%;">เสร็จสิ้น</th>
        <th style="width: 8%;">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 15px;">ไม่พบข้อมูล</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    ลงชื่อ....................................................................ผู้จัดทำรายงาน<br>
    (....................................................................)<br>
    ตำแหน่ง....................................................................<br>
    วันที่ ${printDateStr}
  </div>
</body>
</html>
  `;

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      const triggerPrint = () => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch {
          window.print();
        }
      };

      const img = doc.querySelector('img');
      if (img) {
        if (img.complete) {
          setTimeout(triggerPrint, 150);
        } else {
          img.onload = () => setTimeout(triggerPrint, 100);
          img.onerror = () => setTimeout(triggerPrint, 100);
          setTimeout(triggerPrint, 800);
        }
      } else {
        setTimeout(triggerPrint, 200);
      }
    } else {
      window.print();
    }
  } catch (err) {
    console.warn('Report print iframe error, falling back to window.print():', err);
    window.print();
  }
}
