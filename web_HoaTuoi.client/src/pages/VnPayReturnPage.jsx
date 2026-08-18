// src/pages/VnPayReturnPage.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VnPayReturnPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');

    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    const amount = searchParams.get('vnp_Amount');
    const transactionNo = searchParams.get('vnp_TransactionNo');

    useEffect(() => {
        if (responseCode === '00') {
            setStatus('success');
        } else {
            setStatus('failed');
        }
    }, [responseCode]);

    const formattedAmount = amount ? new Intl.NumberFormat('vi-VN').format(Number(amount) / 100) + 'đ' : '';

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-gray-500">Đang xử lý kết quả thanh toán...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-amber-50 to-stone-100">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-5">
                {status === 'success' ? (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Thanh toán thành công!</h1>
                        <p className="text-gray-500">Cảm ơn bạn đã mua hàng tại Flower Shop</p>
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mã đơn hàng</span>
                                <span className="font-semibold text-gray-900">{txnRef}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Số tiền</span>
                                <span className="font-semibold text-amber-600">{formattedAmount}</span>
                            </div>
                            {transactionNo && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mã giao dịch VNPay</span>
                                    <span className="font-mono text-gray-900">{transactionNo}</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Thanh toán thất bại</h1>
                        <p className="text-gray-500">Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
                        {txnRef && (
                            <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mã đơn hàng</span>
                                    <span className="font-semibold text-gray-900">{txnRef}</span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex gap-3 pt-2">
                    <Link to="/" className="flex-1 btn-primary py-3 text-center block">
                        Về trang chủ
                    </Link>
                    <Link to="/don-hang" className="flex-1 py-3 text-center block border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition">
                        Đơn hàng của tôi
                    </Link>
                </div>
            </div>
        </div>
    );
}
