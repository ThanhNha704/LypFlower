import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Award, Users, RefreshCw, DollarSign, Wallet, ShoppingBag, MapPin, ClipboardList, Download, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function AdminReports() {
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [locationSales, setLocationSales] = useState([]);
  const [fulfillmentStats, setFulfillmentStats] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalProfit: 0, totalQty: 0, totalOrders: 0 });
  const [timeRange, setTimeRange] = useState('year'); // month, year
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const chartCategoryData = (() => {
    if (!categorySales || categorySales.length === 0) return [];
    const sorted = [...categorySales].sort((a, b) => b.revenue - a.revenue);
    if (sorted.length <= 6) return sorted;
    const top = sorted.slice(0, 5);
    const otherSum = sorted.slice(5).reduce((sum, item) => sum + item.revenue, 0);
    const otherQty = sorted.slice(5).reduce((sum, item) => sum + item.quantity, 0);
    const otherProfit = sorted.slice(5).reduce((sum, item) => sum + item.profit, 0);
    return [
      ...top,
      {
        categoryName: 'Danh mục khác',
        revenue: otherSum,
        quantity: otherQty,
        profit: otherProfit
      }
    ];
  })();

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resChart, resTopProducts, resCustomerSegments, resStats, resCategory, resLocation, resFulfillment] = await Promise.all([
        apiClient.get(`/analytics/revenue-chart?type=${timeRange}`),
        apiClient.get('/analytics/top-products'),
        apiClient.get('/analytics/customer-segments'),
        apiClient.get('/analytics/stats'),
        apiClient.get('/analytics/category-sales'),
        apiClient.get('/analytics/location-sales'),
        apiClient.get('/analytics/fulfillment-stats'),
      ]);
      setChartData(resChart.data);
      setTopProducts(resTopProducts.data);
      setCustomerSegments(resCustomerSegments.data);
      setCategorySales(resCategory.data);
      setLocationSales(resLocation.data);
      setFulfillmentStats(resFulfillment.data);
      setStats({
        totalRevenue: resStats.data?.TotalRevenue ?? resStats.data?.totalRevenue ?? 0,
        totalProfit: resStats.data?.TotalProfit ?? resStats.data?.totalProfit ?? 0,
        totalQty: resStats.data?.TotalQty ?? resStats.data?.totalQty ?? 0,
        totalOrders: resStats.data?.TotalOrders ?? resStats.data?.totalOrders ?? 0,
      });
    } catch {
      toast.error('Lỗi tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDwh = async () => {
    setSyncing(true);
    const loadToast = toast.loading('Đang đồng bộ dữ liệu giao dịch sang DWH...');
    try {
      await apiClient.post('/analytics/sync');
      toast.success('Đồng bộ dữ liệu DWH thành công!', { id: loadToast });
      fetchData();
    } catch (e) {
      toast.error('Lỗi đồng bộ DWH: ' + (e.response?.data?.message || e.message), { id: loadToast });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Lyp Flower Admin';
      workbook.lastModifiedBy = 'Lyp Flower Admin';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Style constants
      const primaryHeaderStyle = {
        font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }, // Slate 800
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '94A3B8' } },
          bottom: { style: 'medium', color: { argb: '475569' } },
          left: { style: 'thin', color: { argb: '94A3B8' } },
          right: { style: 'thin', color: { argb: '94A3B8' } }
        }
      };

      const titleStyle = {
        font: { name: 'Arial', size: 14, bold: true, color: { argb: '0F172A' } }
      };

      const subtitleStyle = {
        font: { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } }
      };

      const dataStyle = {
        font: { name: 'Arial', size: 10 },
        alignment: { vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        }
      };

      const totalStyle = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: '0F172A' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } }, // Slate 100
        border: {
          top: { style: 'thin', color: { argb: '94A3B8' } },
          bottom: { style: 'double', color: { argb: '475569' } },
          left: { style: 'thin', color: { argb: '94A3B8' } },
          right: { style: 'thin', color: { argb: '94A3B8' } }
        }
      };

      // ── SHEET 1: TỔNG QUAN KPI ─────────────────────────────
      const wsOverview = workbook.addWorksheet('Tổng quan KPI');
      wsOverview.views = [{ showGridLines: true }];
      
      const tRow = wsOverview.addRow(["BÁO CÁO THỐNG KÊ TỔNG QUAN KPI - LYP FLOWER"]);
      tRow.getCell(1).font = titleStyle.font;
      const subRow1 = wsOverview.addRow(["Hệ thống phân tích Kho dữ liệu (DWH & OLAP)"]);
      subRow1.getCell(1).font = subtitleStyle.font;
      wsOverview.addRow([`Thời điểm xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`]);
      wsOverview.addRow([]);
      
      const ovHeaders = wsOverview.addRow(["Chỉ số báo cáo", "Giá trị thực tế", "Đơn vị tính", "Ý nghĩa & Phân tích chuyên sâu"]);
      ovHeaders.height = 28;
      ovHeaders.eachCell((cell) => {
        Object.assign(cell, primaryHeaderStyle);
      });

      const rows = [
        ["Tổng doanh thu DWH", stats.totalRevenue, "VND", "Tổng doanh thu bán hàng tích lũy từ các đơn hàng hoàn thành."],
        ["Lợi nhuận ròng DWH", stats.totalProfit, "VND", "Doanh thu sau khi trừ đi giá vốn sản phẩm và chiết khấu giảm giá."],
        ["Sản lượng hoa bán ra", stats.totalQty, "Cành/Bó", "Tổng số lượng sản phẩm hoa đã giao thành công đến tay khách hàng."],
        ["Số lượng đơn hàng thành công", stats.totalOrders, "Đơn", "Tổng số lượng giao dịch mua bán thành công."]
      ];

      rows.forEach((r, idx) => {
        const row = wsOverview.addRow(r);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          Object.assign(cell, dataStyle);
          if (colNum === 2) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          } else if (colNum === 3) {
            cell.alignment = { horizontal: 'center' };
          }
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      // Thêm các chỉ số tính toán thông minh bằng công thức Excel
      const aovRow = wsOverview.addRow(["Giá trị đơn hàng trung bình (AOV)", { formula: '=B6/B9' }, "VND", "Doanh số trung bình thu được trên mỗi đơn hàng."]);
      aovRow.height = 22;
      aovRow.eachCell((cell, colNum) => {
        Object.assign(cell, dataStyle);
        cell.font = { name: 'Arial', size: 10, bold: true };
        if (colNum === 2) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 3) {
          cell.alignment = { horizontal: 'center' };
        }
      });

      const gpmRow = wsOverview.addRow(["Tỷ suất lợi nhuận ròng", { formula: '=B7/B6' }, "%", "Tỷ lệ lợi nhuận ròng thu về trên mỗi đồng doanh thu (hiệu suất sinh lời)."]);
      gpmRow.height = 22;
      gpmRow.eachCell((cell, colNum) => {
        Object.assign(cell, dataStyle);
        cell.font = { name: 'Arial', size: 10, bold: true };
        if (colNum === 2) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 3) {
          cell.alignment = { horizontal: 'center' };
        }
      });

      wsOverview.getColumn(1).width = 35;
      wsOverview.getColumn(2).width = 25;
      wsOverview.getColumn(3).width = 15;
      wsOverview.getColumn(4).width = 60;

      // ── SHEET 2: DOANH SỐ DANH MỤC ─────────────────────────
      const wsCategory = workbook.addWorksheet('Doanh số Danh mục');
      wsCategory.views = [{ showGridLines: true }];
      
      const catTitle = wsCategory.addRow(["BÁO CÁO DOANH THU & LỢI NHUẬN THEO DANH MỤC SẢN PHẨM"]);
      catTitle.getCell(1).font = titleStyle.font;
      const subRow2 = wsCategory.addRow(["Phân tích tỷ trọng doanh số và tỷ suất lợi nhuận của từng danh mục hoa tươi"]);
      subRow2.getCell(1).font = subtitleStyle.font;
      wsCategory.addRow([]);

      const catHeaders = wsCategory.addRow([
        "Tên Danh Mục Hoa", 
        "Sản Lượng Bán (Bó/Cành)", 
        "Doanh Thu (VND)", 
        "Tỷ Trọng Doanh Thu (%)",
        "Lợi Nhuận Ròng (VND)",
        "Tỷ Suất Lợi Nhuận (%)"
      ]);
      catHeaders.height = 28;
      catHeaders.eachCell((cell) => {
        Object.assign(cell, primaryHeaderStyle);
      });

      let totalCatQty = 0;
      let totalCatRev = 0;
      let totalCatProfit = 0;
      const catStartRowIndex = 5;
      const catDataLength = categorySales.length;

      categorySales.forEach((item, idx) => {
        totalCatQty += item.quantity;
        totalCatRev += item.revenue;
        totalCatProfit += item.profit;
        
        const currentRowNum = catStartRowIndex + idx;
        const totalRowNum = catStartRowIndex + catDataLength;

        const row = wsCategory.addRow([
          item.categoryName, 
          item.quantity, 
          item.revenue, 
          { formula: `=C${currentRowNum}/C${totalRowNum}` },
          item.profit,
          { formula: `=E${currentRowNum}/C${currentRowNum}` }
        ]);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          Object.assign(cell, dataStyle);
          if (colNum === 2 || colNum === 3 || colNum === 5) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          } else if (colNum === 4 || colNum === 6) {
            cell.numFmt = '0.0%';
            cell.alignment = { horizontal: 'right' };
          }
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      const catTotalRow = wsCategory.addRow([
        "Tổng cộng", 
        totalCatQty, 
        totalCatRev, 
        { formula: '=SUM(D5:D' + (catStartRowIndex + catDataLength - 1) + ')' },
        totalCatProfit,
        { formula: `=E${catStartRowIndex + catDataLength}/C${catStartRowIndex + catDataLength}` }
      ]);
      catTotalRow.height = 24;
      catTotalRow.eachCell((cell, colNum) => {
        Object.assign(cell, totalStyle);
        if (colNum === 2 || colNum === 3 || colNum === 5) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 4 || colNum === 6) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        }
      });

      wsCategory.getColumn(1).width = 25;
      wsCategory.getColumn(2).width = 22;
      wsCategory.getColumn(3).width = 22;
      wsCategory.getColumn(4).width = 22;
      wsCategory.getColumn(5).width = 22;
      wsCategory.getColumn(6).width = 22;

      // ── SHEET 3: ĐỊA BÀN GIAO HÀNG ─────────────────────────
      const wsLocation = workbook.addWorksheet('Địa bàn giao hàng');
      wsLocation.views = [{ showGridLines: true }];
      
      const locTitle = wsLocation.addRow(["PHÂN BỔ DOANH THU THEO QUẬN NỘI THÀNH TP.HCM"]);
      locTitle.getCell(1).font = titleStyle.font;
      const subRow3 = wsLocation.addRow(["Báo cáo phân tích phân khúc địa lý và mật độ đơn hàng của khách hàng"]);
      subRow3.getCell(1).font = subtitleStyle.font;
      wsLocation.addRow([]);

      const locHeaders = wsLocation.addRow([
        "Khu Vực/Quận Huyện", 
        "Số Đơn Hàng", 
        "Tỷ Lệ Đơn Hàng (%)",
        "Doanh Thu (VND)",
        "Tỷ Trọng Doanh Số (%)"
      ]);
      locHeaders.height = 28;
      locHeaders.eachCell((cell) => {
        Object.assign(cell, primaryHeaderStyle);
      });

      let totalLocOrders = 0;
      let totalLocRev = 0;
      const locStartRowIndex = 5;
      const locDataLength = locationSales.length;

      locationSales.forEach((item, idx) => {
        totalLocOrders += item.orderCount;
        totalLocRev += item.revenue;

        const currentRowNum = locStartRowIndex + idx;
        const totalRowNum = locStartRowIndex + locDataLength;

        const row = wsLocation.addRow([
          item.location, 
          item.orderCount, 
          { formula: `=B${currentRowNum}/B${totalRowNum}` },
          item.revenue,
          { formula: `=D${currentRowNum}/D${totalRowNum}` }
        ]);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          Object.assign(cell, dataStyle);
          if (colNum === 2 || colNum === 4) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          } else if (colNum === 3 || colNum === 5) {
            cell.numFmt = '0.0%';
            cell.alignment = { horizontal: 'right' };
          }
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      const locTotalRow = wsLocation.addRow([
        "Tổng cộng", 
        totalLocOrders, 
        { formula: '=SUM(C5:C' + (locStartRowIndex + locDataLength - 1) + ')' },
        totalLocRev,
        { formula: '=SUM(E5:E' + (locStartRowIndex + locDataLength - 1) + ')' }
      ]);
      locTotalRow.height = 24;
      locTotalRow.eachCell((cell, colNum) => {
        Object.assign(cell, totalStyle);
        if (colNum === 2 || colNum === 4) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 3 || colNum === 5) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        }
      });

      wsLocation.getColumn(1).width = 25;
      wsLocation.getColumn(2).width = 20;
      wsLocation.getColumn(3).width = 20;
      wsLocation.getColumn(4).width = 25;
      wsLocation.getColumn(5).width = 20;

      // ── SHEET 4: CƠ CẤU GIAO NHẬN ──────────────────────────
      const wsFulfillment = workbook.addWorksheet('Cơ cấu giao nhận');
      wsFulfillment.views = [{ showGridLines: true }];
      
      const fulTitle = wsFulfillment.addRow(["BÁO CÁO THỐNG KÊ PHƯƠNG THỨC GIAO NHẬN"]);
      fulTitle.getCell(1).font = titleStyle.font;
      const subRow4 = wsFulfillment.addRow(["So sánh mức độ hiệu quả và cơ cấu giữa nhận tại cửa hàng vs giao hàng tận nơi"]);
      subRow4.getCell(1).font = subtitleStyle.font;
      wsFulfillment.addRow([]);

      const fulHeaders = wsFulfillment.addRow([
        "Phương thức nhận hoa", 
        "Số lượng đơn hàng", 
        "Tỷ lệ đơn hàng (%)",
        "Tổng tiền thanh toán (VND)",
        "Tỷ trọng doanh số (%)"
      ]);
      fulHeaders.height = 28;
      fulHeaders.eachCell((cell) => {
        Object.assign(cell, primaryHeaderStyle);
      });

      let totalFulOrders = 0;
      let totalFulAmount = 0;
      const fulStartRowIndex = 5;
      const fulDataLength = fulfillmentStats.length;

      fulfillmentStats.forEach((item, idx) => {
        totalFulOrders += item.count;
        totalFulAmount += item.amount;

        const currentRowNum = fulStartRowIndex + idx;
        const totalRowNum = fulStartRowIndex + fulDataLength;

        const row = wsFulfillment.addRow([
          item.method === 'Delivery' ? 'Giao hàng tận nơi' : 'Tự nhận tại cửa hàng', 
          item.count, 
          { formula: `=B${currentRowNum}/B${totalRowNum}` },
          item.amount,
          { formula: `=D${currentRowNum}/D${totalRowNum}` }
        ]);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          Object.assign(cell, dataStyle);
          if (colNum === 2 || colNum === 4) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          } else if (colNum === 3 || colNum === 5) {
            cell.numFmt = '0.0%';
            cell.alignment = { horizontal: 'right' };
          }
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      const fulTotalRow = wsFulfillment.addRow([
        "Tổng cộng", 
        totalFulOrders, 
        { formula: '=SUM(C5:C' + (fulStartRowIndex + fulDataLength - 1) + ')' },
        totalFulAmount,
        { formula: '=SUM(E5:E' + (fulStartRowIndex + fulDataLength - 1) + ')' }
      ]);
      fulTotalRow.height = 24;
      fulTotalRow.eachCell((cell, colNum) => {
        Object.assign(cell, totalStyle);
        if (colNum === 2 || colNum === 4) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 3 || colNum === 5) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        }
      });

      wsFulfillment.getColumn(1).width = 25;
      wsFulfillment.getColumn(2).width = 20;
      wsFulfillment.getColumn(3).width = 20;
      wsFulfillment.getColumn(4).width = 25;
      wsFulfillment.getColumn(5).width = 20;

      // ── SHEET 5: TOP HOA BÁN CHẠY ──────────────────────────
      const wsTopProducts = workbook.addWorksheet('Top hoa bán chạy');
      wsTopProducts.views = [{ showGridLines: true }];
      
      const topTitle = wsTopProducts.addRow(["DANH SÁCH TOP SẢN PHẨM BÁN CHẠY NHẤT"]);
      topTitle.getCell(1).font = titleStyle.font;
      const subRow5 = wsTopProducts.addRow(["Top 5 sản phẩm có sản lượng bán ra nhiều nhất dựa trên DWH"]);
      subRow5.getCell(1).font = subtitleStyle.font;
      wsTopProducts.addRow([]);

      const topHeaders = wsTopProducts.addRow(["Thứ hạng", "Mã sản phẩm", "Tên sản phẩm", "Sản lượng đã bán (Bó/Cành)"]);
      topHeaders.height = 28;
      topHeaders.eachCell((cell) => {
        Object.assign(cell, primaryHeaderStyle);
      });

      topProducts.forEach((item, idx) => {
        const row = wsTopProducts.addRow([
          idx + 1, 
          item.productId, 
          item.productName, 
          item.totalSold
        ]);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          Object.assign(cell, dataStyle);
          if (colNum === 1 || colNum === 2) {
            cell.alignment = { horizontal: 'center' };
          } else if (colNum === 4) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          }
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      wsTopProducts.getColumn(1).width = 15;
      wsTopProducts.getColumn(2).width = 18;
      wsTopProducts.getColumn(3).width = 40;
      wsTopProducts.getColumn(4).width = 25;

      // ── SHEET 6: PHÂN KHÚC KHÁCH HÀNG ──────────────────────
      const wsSegments = workbook.addWorksheet('Phân khúc Khách hàng');
      wsSegments.views = [{ showGridLines: true }];
      
      const segTitle = wsSegments.addRow(["PHÂN TÍCH PHÂN KHÚC KHÁCH HÀNG"]);
      segTitle.getCell(1).font = titleStyle.font;
      const subRow6 = wsSegments.addRow(["Phân nhóm khách hàng dựa trên sản lượng và mức đóng góp doanh số"]);
      subRow6.getCell(1).font = subtitleStyle.font;
      wsSegments.addRow([]);

      const segHeaders = wsSegments.addRow(["Phân khúc khách hàng", "Số lượng khách hàng (KH)", "Tỷ trọng (%)"]);
      segHeaders.height = 28;
      segHeaders.eachCell((cell) => {
        Object.assign(cell, primaryHeaderStyle);
      });

      let totalSegUsers = 0;
      const segStartRowIndex = 5;
      const segDataLength = customerSegments.length;

      customerSegments.forEach((item, idx) => {
        totalSegUsers += item.count;

        const currentRowNum = segStartRowIndex + idx;
        const totalRowNum = segStartRowIndex + segDataLength;

        const row = wsSegments.addRow([
          item.segment, 
          item.count, 
          { formula: `=B${currentRowNum}/B${totalRowNum}` }
        ]);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          Object.assign(cell, dataStyle);
          if (colNum === 2) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          } else if (colNum === 3) {
            cell.numFmt = '0.0%';
            cell.alignment = { horizontal: 'right' };
          }
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      const segTotalRow = wsSegments.addRow([
        "Tổng cộng", 
        totalSegUsers, 
        { formula: '=SUM(C5:C' + (segStartRowIndex + segDataLength - 1) + ')' }
      ]);
      segTotalRow.height = 24;
      segTotalRow.eachCell((cell, colNum) => {
        Object.assign(cell, totalStyle);
        if (colNum === 2) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 3) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        }
      });

      wsSegments.getColumn(1).width = 30;
      wsSegments.getColumn(2).width = 25;
      wsSegments.getColumn(3).width = 20;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Bao_Cao_Thong_Ke_DWH_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Xuất file báo cáo Excel thành công!");

    } catch (e) {
      console.error(e);
      toast.error("Lỗi xuất file báo cáo!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header với nút đồng bộ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Báo cáo & Thống kê (DWH)</h1>
          <p className="text-sm text-gray-500 mt-1">Dữ liệu phân tích trực tiếp từ Data Warehouse (HoaTuoi_DWH)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            Xuất báo cáo (Excel)
          </button>
          <button
            onClick={handleSyncDwh}
            disabled={syncing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ Kho dữ liệu (ETL)'}
          </button>
        </div>
      </div>

      {/* Grid thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng Doanh Thu</p>
            <p className="text-lg font-black text-slate-800 mt-1">{formatVnd(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lợi Nhuận Ròng</p>
            <p className="text-lg font-black text-slate-800 mt-1">{formatVnd(stats.totalProfit)}</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sản Lượng Bán</p>
            <p className="text-lg font-black text-slate-800 mt-1">{stats.totalQty} cành/bó</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Số Đơn Hàng</p>
            <p className="text-lg font-black text-slate-800 mt-1">{stats.totalOrders} đơn</p>
          </div>
        </div>
      </div>

      {/* Grid Biểu đồ và Top sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu & Lợi nhuận cột kép */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-amber-500" /> Báo cáo Doanh thu & Lợi nhuận
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">So sánh tăng trưởng doanh thu so với lợi nhuận ròng hàng tháng</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              <span className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white text-gray-900 shadow-sm">
                Năm nay
              </span>
            </div>
          </div>

          <div className="h-80 w-full mt-4">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}Tr`} />
                  <RechartsTooltip 
                    formatter={(value, name) => [formatVnd(value), name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận ròng']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="profit" name="Lợi nhuận ròng" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Sản phẩm + Phân khúc KH */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {/* Top 5 sản phẩm */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-amber-500" />
              <h2 className="font-bold text-gray-900 text-lg">Top hoa bán chạy</h2>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)
              ) : topProducts.length > 0 ? (
                topProducts.map((p, idx) => (
                  <div key={p.productId ?? idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold
                      ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.productName}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{p.totalSold} bán</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          {/* Phân khúc khách hàng */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-blue-500" />
              <h2 className="font-bold text-gray-900 text-lg">Phân khúc khách hàng</h2>
            </div>
            <div className="space-y-2">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)
              ) : customerSegments.length > 0 ? (
                customerSegments.map((s, idx) => {
                  const cls = idx === 0 ? 'bg-purple-100 text-purple-700' : idx === 1 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
                  return (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>{s.segment}</span>
                      <span className="font-bold text-gray-800">{s.count} KH</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Biểu đồ Danh mục và Địa bàn (HCMC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Cơ cấu doanh thu theo Danh mục */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Percent size={20} className="text-purple-500" /> Cơ cấu doanh thu Danh mục
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Tỷ trọng doanh thu giữa các danh mục hoa tươi</p>
          </div>
          <div className="h-64 w-full relative flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            ) : chartCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartCategoryData}
                    dataKey="revenue"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {chartCategoryData.map((entry, index) => {
                      const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatVnd(value)} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Phân bổ doanh thu theo Quận (HCMC) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <MapPin size={20} className="text-emerald-500" /> Thống kê khu vực giao nhận (TP.HCM)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Top khu vực quận/huyện nội thành đóng góp doanh số cao nhất</p>
          </div>
          <div className="h-64 w-full">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            ) : locationSales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationSales} layout="vertical" margin={{ left: 15, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}Tr`} />
                  <YAxis dataKey="location" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip formatter={(value) => formatVnd(value)} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={15} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Chi tiết Giao nhận (Fulfillment) và Số liệu thô */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-500" /> Báo cáo chi tiết Cơ cấu Giao nhận & Doanh số
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bảng cơ cấu giao nhận */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Phương thức nhận hoa</th>
                  <th className="px-4 py-3 text-right">Số lượng đơn</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fulfillmentStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.method}</td>
                    <td className="px-4 py-3 text-right">{item.count} đơn</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">{formatVnd(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bảng chi tiết danh mục */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3 text-right">Sản lượng</th>
                  <th className="px-4 py-3 text-right">Lợi nhuận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorySales.slice(0, 4).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.categoryName}</td>
                    <td className="px-4 py-3 text-right">{item.quantity} cành/bó</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatVnd(item.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
