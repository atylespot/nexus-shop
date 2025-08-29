"use client";
import { useEffect, useMemo, useState } from "react";

type Product = {
	id: string;
	name: string;
	slug: string;
	categoryId: number;
	categoryName: string;
	images: string[];
	buyPrice: number;
	currency: string;
};

type PurchaseRow = {
	id: number; // purchase id
	productId: string; // product id
	name: string;
	category: string;
	image?: string;
	quantity: number;
	unitPrice: number;
	currency: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	createdAt?: string;
};

type MetricSet = {
	totalAmount: number;
	totalCount: number;
	categoryBreakdown: Record<string, { amount: number; count: number }>;
	timeMetrics: {
		today: number;
		yesterday: number;
		thisWeek: number;
		thisMonth: number;
		lastMonth: number;
		thisYear: number;
	};
};

type MetricsResponse = MetricSet & {
	details: {
		otherExpenses: MetricSet;
		productPurchases: MetricSet;
	};
	dateRange: {
		start: string;
		end: string;
	};
};

export default function FinancePage() {
	const [activeTab, setActiveTab] = useState<"products" | "others" | "metrics">("products");
	const [products, setProducts] = useState<Product[]>([]);
	const [purchaseRows, setPurchaseRows] = useState<PurchaseRow[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [expenseModalOpen, setExpenseModalOpen] = useState(false);
	const [expenses, setExpenses] = useState<any[]>([]);
	const [expenseForm, setExpenseForm] = useState({ title: "", category: "Salary", amount: 0, currency: "BDT", date: "", note: "", createdBy: "" });
	// Edit expense modal state
	const [expenseEditModalOpen, setExpenseEditModalOpen] = useState(false);
	const [expenseEditRow, setExpenseEditRow] = useState<any | null>(null);
	const [expenseEditForm, setExpenseEditForm] = useState({ title: "", category: "Salary", amount: 0, currency: "BDT", date: "", note: "", createdBy: "" });
	// Simple notification toast
	const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
	const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
		setNotice({ text, type });
		setTimeout(() => setNotice(null), 2500);
	};
	const [purchaseActionBusy, setPurchaseActionBusy] = useState<number | null>(null);
	const [expenseActionBusy, setExpenseActionBusy] = useState<number | null>(null);
	const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
	const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
	// Filters
	const [productFilter, setProductFilter] = useState({ q: "", category: "All", startDate: "", endDate: "" });
	const [expenseFilter, setExpenseFilter] = useState({ q: "", category: "All", startDate: "", endDate: "" });
	// Pagination states
	const [productPage, setProductPage] = useState(1);
	const [expensePage, setExpensePage] = useState(1);
	const itemsPerPage = 10;

	// Pagination calculations
	const productCategories = useMemo(() => Array.from(new Set((purchaseRows || []).map(r => r.category).filter(Boolean))), [purchaseRows]);
	const filteredPurchaseRows = useMemo(() => {
		return (purchaseRows || []).filter(row => {
			const q = productFilter.q.trim().toLowerCase();
			const matchesQ = !q || row.name.toLowerCase().includes(q) || (row.category || "").toLowerCase().includes(q);
			const matchesCategory = productFilter.category === "All" || row.category === productFilter.category;
			const rowDate = row.createdAt ? new Date(row.createdAt) : null;
			const matchesStart = !productFilter.startDate || (rowDate && rowDate >= new Date(productFilter.startDate));
			const matchesEnd = !productFilter.endDate || (rowDate && rowDate <= new Date(productFilter.endDate));
			return matchesQ && matchesCategory && matchesStart && matchesEnd;
		});
	}, [purchaseRows, productFilter]);

	const filteredExpenses = useMemo(() => {
		return (expenses || []).filter(exp => {
			const q = expenseFilter.q.trim().toLowerCase();
			const matchesQ = !q || (exp.title || "").toLowerCase().includes(q) || (exp.createdBy || "").toLowerCase().includes(q) || (exp.category || "").toLowerCase().includes(q);
			const matchesCategory = expenseFilter.category === "All" || exp.category === expenseFilter.category;
			const expDate = exp.date ? new Date(exp.date) : null;
			const matchesStart = !expenseFilter.startDate || (expDate && expDate >= new Date(expenseFilter.startDate));
			const matchesEnd = !expenseFilter.endDate || (expDate && expDate <= new Date(expenseFilter.endDate));
			return matchesQ && matchesCategory && matchesStart && matchesEnd;
		});
	}, [expenses, expenseFilter]);

	const totalProductPages = Math.ceil((filteredPurchaseRows?.length || 0) / itemsPerPage);
	const totalExpensePages = Math.ceil((filteredExpenses?.length || 0) / itemsPerPage);
	
	const startProductIndex = (productPage - 1) * itemsPerPage;
	const endProductIndex = startProductIndex + itemsPerPage;
	const startExpenseIndex = (expensePage - 1) * itemsPerPage;
	const endExpenseIndex = startExpenseIndex + itemsPerPage;
	
	const currentProducts = filteredPurchaseRows?.slice(startProductIndex, endProductIndex) || [];
	const currentExpenses = filteredExpenses?.slice(startExpenseIndex, endExpenseIndex) || [];

	// Show pagination info even when there's only one page
	const showProductPagination = filteredPurchaseRows && filteredPurchaseRows.length > 0;
	const showExpensePagination = filteredExpenses && filteredExpenses.length > 0;

	// Helper function to format page range display
	const formatPageRange = (start: number, end: number, total: number) => {
		return `${start + 1}-${Math.min(end, total)} of ${total}`;
	};

	// Handle edge case when current page is beyond available pages
	useEffect(() => {
		if (productPage > totalProductPages && totalProductPages > 0) {
			setProductPage(totalProductPages);
		}
		if (expensePage > totalExpensePages && totalExpensePages > 0) {
			setExpensePage(totalExpensePages);
		}
	}, [productPage, totalProductPages, expensePage, totalExpensePages]);

	// Reset pagination when switching tabs to ensure consistent experience
	useEffect(() => {
		setProductPage(1);
		setExpensePage(1);
	}, [activeTab]);

	// Reset pagination when data changes to ensure users see first page of new results
	useEffect(() => {
		if (purchaseRows.length > 0) {
			setProductPage(1);
		}
	}, [purchaseRows.length]);

	useEffect(() => {
		if (expenses.length > 0) {
			setExpensePage(1);
		}
	}, [expenses.length]);

	const expenseCategories = [
		"Salary",
		"Bonus & Incentives",
		"Commission",
		"Utilities",
		"Electricity",
		"Water",
		"Gas",
		"Internet",
		"Phone & Mobile",
		"Shop Rent",
		"Office Rent",
		"Office Supplies",
		"Packaging",
		"Printing",
		"Maintenance",
		"Repair",
		"Cleaning",
		"Security",
		"Transportation",
		"Fuel",
		"Delivery/Courier",
		"Marketing",
		"Advertising",
		"Software Subscription",
		"Cloud Services",
		"Domain & Hosting",
		"Bank Charges",
		"Payment Gateway Fees",
		"Taxes & Govt Fees",
		"Insurance",
		"Training",
		"Professional Services",
		"Legal & Accounting",
		"Travel",
		"Meals & Entertainment",
		"Miscellaneous",
		"Other"
	];
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
	// Edit purchase modal state
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editRow, setEditRow] = useState<PurchaseRow | null>(null);
const [editQuantity, setEditQuantity] = useState<number>(1);
const [editNote, setEditNote] = useState<string>("");

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/products");
				if (res.ok) {
					const data = await res.json();
					const mapped: Product[] = data.map((p: any) => ({
						id: p.id?.toString(),
						name: p.name,
						slug: p.slug,
						categoryId: p.categoryId,
						categoryName: p.categoryName,
						images: p.images || [],
						buyPrice: typeof p.buyPrice === 'number' ? p.buyPrice : parseFloat(p.buyPrice || 0),
						currency: p.currency || 'BDT',
					}));
					setProducts(mapped);
				}
			} catch {}
		})();
	}, []);

	const loadRows = async () => {
		try {
			const r = await fetch('/api/purchases');
			if (r.ok) {
				const data = await r.json();
				const mapped: PurchaseRow[] = data.map((d: any) => ({
					id: d.id,
					productId: d.productId?.toString(),
					name: d.product?.name,
					category: d.product?.category?.name,
					image: d.product?.images?.[0]?.url,
					quantity: d.quantity,
					unitPrice: d.unitPrice,
					currency: d.currency,
					status: d.status,
					createdAt: d.createdAt,
				}));
				setPurchaseRows(mapped);
			}
		} catch {}
	};

	useEffect(() => { loadRows(); }, []);

	const loadExpenses = async () => {
		try {
			const r = await fetch('/api/expenses');
			if (r.ok) {
				setExpenses(await r.json());
			}
		} catch {}
	};

	const addExpense = async () => {
		try {
			const payload = {
				title: expenseForm.title,
				category: expenseForm.category,
				amount: parseFloat(String(expenseForm.amount) || '0'),
				currency: expenseForm.currency,
				date: expenseForm.date,
				note: expenseForm.note,
				createdBy: expenseForm.createdBy,
			};
			const r = await fetch('/api/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (r.ok) {
				setExpenseModalOpen(false);
				setExpenseForm({ title: "", category: "Salary", amount: 0, currency: "BDT", date: "", note: "", createdBy: "" });
				await loadExpenses();
				showNotice('Expense added successfully!');
			} else {
				showNotice('Failed to add expense.', 'error');
			}
		} catch (e) {
			showNotice('Failed to add expense.', 'error');
		}
	};

	const loadMetrics = async () => {
		try {
			const params = new URLSearchParams();
			if (dateRange.startDate) params.append('startDate', dateRange.startDate);
			if (dateRange.endDate) params.append('endDate', dateRange.endDate);
			const r = await fetch(`/api/finance/metrics?${params.toString()}`);
			if (r.ok) {
				const data: MetricsResponse = await r.json();
				setMetrics(data);
			}
		} catch (error) {
			console.error("Error loading metrics:", error);
		}
	};

	useEffect(() => { 
		if (activeTab === 'others') loadExpenses(); 
		if (activeTab === 'metrics') loadMetrics();
	}, [activeTab]);

	useEffect(() => {
		if (activeTab === 'metrics') loadMetrics();
	}, [dateRange]);

	const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);

	const addPurchaseRow = async () => {
		if (!selectedProduct) return;
		const qty = Math.max(1, selectedQuantity || 1);
		const r = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: selectedProduct.id, quantity: qty }) });
		if (r.ok) {
			// Optimistic add without full reload
			try {
				const created = await r.json();
				const mapped: PurchaseRow = {
					id: created?.id,
					productId: selectedProduct.id,
					name: selectedProduct.name,
					category: selectedProduct.categoryName,
					image: selectedProduct.images?.[0],
					quantity: qty,
					unitPrice: selectedProduct.buyPrice,
					currency: selectedProduct.currency,
					status: 'PENDING',
					createdAt: new Date().toISOString()
				};
				setPurchaseRows(prev => [mapped, ...(prev || [])]);
			} catch {}
			setModalOpen(false);
			setSelectedProductId("");
			setSelectedQuantity(1);
			showNotice("Product added successfully!");
		} else {
			showNotice("Failed to add product.", "error");
		}
	};

	const act = async (rowId: number, action: 'APPROVE' | 'REJECT' | 'DELETE') => {
		try {
			setPurchaseActionBusy(rowId);
			if (action === 'DELETE') {
				const r = await fetch(`/api/purchases/${rowId}`, { method: 'DELETE' });
				if (!r.ok) {
					const err = await r.json().catch(() => ({} as any));
					showNotice(err?.error || 'Delete failed', 'error');
					return;
				}
				showNotice('Purchase deleted', 'success');
				setPurchaseRows(prev => prev.filter(p => p.id !== rowId));
			} else {
				const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
				const r = await fetch(`/api/purchases/${rowId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
				if (!r.ok) {
					const err = await r.json().catch(() => ({} as any));
					showNotice(err?.error || 'Update failed', 'error');
					return;
				}
				showNotice(`Purchase ${status.toLowerCase()}`, 'success');
				setPurchaseRows(prev => prev.map(p => p.id === rowId ? { ...p, status } : p));
			}
		} catch (e) {
			showNotice('Action failed', 'error');
		} finally {
			setPurchaseActionBusy(null);
		}
	};

	const openEdit = (row: PurchaseRow) => {
		setEditRow(row);
		setEditQuantity(row.quantity);
		setEditNote("");
		setEditModalOpen(true);
	};

	const saveEdit = async () => {
		if (!editRow) return;
		const qty = Math.max(1, editQuantity || 1);
		const r = await fetch(`/api/purchases/${editRow.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ quantity: qty, note: editNote })
		});
		if (r.ok) {
			setEditModalOpen(false);
			setEditRow(null);
			// Optimistic update without full reload
			setPurchaseRows(prev => prev.map(p => p.id === (editRow as PurchaseRow).id ? { ...p, quantity: qty, /* note is not displayed in table, keep internally */ } : p));
			showNotice("Purchase updated successfully!");
		} else {
			showNotice("Failed to update purchase.", "error");
		}
	};

	const handleExpenseAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
		try {
			setExpenseActionBusy(parseInt(id));
			const r = await fetch(`/api/expenses/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (r.ok) {
				showNotice(`Expense ${status.toLowerCase()}`, 'success');
				setExpenses(prev => prev.map(e => e.id === parseInt(id) ? { ...e, status } : e));
			} else {
				const err = await r.json().catch(() => ({} as any));
				showNotice(err?.error || 'Update failed', 'error');
				await loadExpenses();
			}
		} catch (error) {
			console.error('Error updating expense status:', error);
			showNotice('Update failed', 'error');
		} finally {
			setExpenseActionBusy(null);
		}
	};

	const handleExpenseDelete = async (id: string) => {
		try {
			setExpenseActionBusy(parseInt(id));
			const r = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
			if (r.ok) {
				showNotice('Expense deleted', 'success');
				setExpenses(prev => prev.filter(e => e.id !== parseInt(id)));
			} else {
				const err = await r.json().catch(() => ({} as any));
				showNotice(err?.error || 'Delete failed', 'error');
				await loadExpenses();
			}
		} catch (error) {
			console.error('Error deleting expense:', error);
			showNotice('Delete failed', 'error');
		} finally {
			setExpenseActionBusy(null);
		}
	};

	const openExpenseEdit = (row: any) => {
		setExpenseEditRow(row);
		setExpenseEditForm({
			title: row.title || "",
			category: row.category || "Salary",
			amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount || 0),
			currency: row.currency || 'BDT',
			date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
			note: row.note || "",
			createdBy: row.createdBy || "",
		});
		setExpenseEditModalOpen(true);
	};

	const saveExpenseEdit = async () => {
		if (!expenseEditRow) return;
		const payload = {
			...expenseEditForm,
			amount: parseFloat(String(expenseEditForm.amount) || '0')
		};
		const r = await fetch(`/api/expenses/${expenseEditRow.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (r.ok) {
			setExpenseEditModalOpen(false);
			setExpenseEditRow(null);
			setExpenses(prev => prev.map(e => e.id === (expenseEditRow as any).id ? { ...e, ...payload } : e));
			showNotice("Expense updated successfully!");
		} else {
			showNotice("Failed to update expense.", "error");
		}
	};

	return (
		<div className="p-6">
			{notice && (
				<div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-white ${notice.type==='success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
					{notice.text}
				</div>
			)}
 
 			{/* Tabs */}
 			<div className="bg-white rounded-lg shadow border mb-4">
 				<div className="flex gap-2 p-3 border-b">
 					<button
 						className={`px-4 py-2 text-sm rounded-md ${activeTab === 'products' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`}
 						onClick={() => setActiveTab('products')}
 					>
 						Product Purchase
 					</button>
					<button
						className={`px-4 py-2 text-sm rounded-md ${activeTab === 'others' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`}
						onClick={() => setActiveTab('others')}
					>
						Others Purchase
					</button>
					<button
						className={`px-4 py-2 text-sm rounded-md ${activeTab === 'metrics' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'}`}
						onClick={() => setActiveTab('metrics')}
					>
						Finance Metrics
					</button>
				</div>

				{/* Tab content */}
				{activeTab === 'products' && (
					<div className="p-4">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-medium">Product vs Purchase</h2>
							<button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
								+ Add Purchased Product
							</button>
						</div>
						{/* Filters */}
						<div className="bg-gray-50 border rounded-md p-3 mb-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-gray-700">Filters</span>
								<button onClick={()=>{setProductPage(1); setProductFilter({ q:"", category:"All", startDate:"", endDate:"" });}} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100">Reset</button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
									<input value={productFilter.q} onChange={(e)=>{setProductPage(1); setProductFilter({...productFilter, q:e.target.value});}} placeholder="Product or Category" className="w-full px-3 py-2 border rounded-md bg-white" />
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
									<select value={productFilter.category} onChange={(e)=>{setProductPage(1); setProductFilter({...productFilter, category:e.target.value});}} className="w-full px-3 py-2 border rounded-md bg-white">
										<option value="All">All</option>
										{productCategories.map(c => (<option key={c} value={c}>{c}</option>))}
									</select>
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
									<input type="date" value={productFilter.startDate} onChange={(e)=>{setProductPage(1); setProductFilter({...productFilter, startDate:e.target.value});}} className="w-full px-3 py-2 border rounded-md bg-white" />
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
									<input type="date" value={productFilter.endDate} onChange={(e)=>{setProductPage(1); setProductFilter({...productFilter, endDate:e.target.value});}} className="w-full px-3 py-2 border rounded-md bg-white" />
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg border overflow-hidden">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{currentProducts.length === 0 && (
										<tr>
											<td colSpan={8} className="px-6 py-8 text-center text-gray-500">No purchases added yet</td>
										</tr>
									)}
									{currentProducts.map((row, idx) => (
										<tr key={idx} className="hover:bg-gray-50">
											<td className="px-6 py-3 whitespace-nowrap">
												<div className="flex items-center">
													{row.image ? (
														<img src={row.image} alt={row.name} className="w-10 h-10 rounded mr-3 object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
													) : (
														<div className="w-10 h-10 rounded bg-gray-200 mr-3" />
													)}
													<div>
														<div className="font-medium text-gray-900">{row.name}</div>
														<div className="text-xs text-gray-500">ID: {row.productId}</div>
													</div>
												</div>
											</td>
											<td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{row.category}</td>
											<td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{row.unitPrice} {row.currency}</td>
											<td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{row.quantity}</td>
											<td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{(row.unitPrice * row.quantity).toFixed(2)} {row.currency}</td>
											<td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
											<td className="px-6 py-3 whitespace-nowrap">
												{row.status === 'APPROVED' ? (
														<span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>
													) : row.status === 'REJECTED' ? (
														<span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>
													) : (
														<span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
													)}
											</td>
											<td className="px-6 py-3 whitespace-nowrap text-right text-sm">
												<div className="inline-flex gap-2">
													<button onClick={() => openEdit(row)} disabled={row.status !== 'PENDING' || purchaseActionBusy===row.id} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">Edit</button>
													<button onClick={() => act(row.id, 'APPROVE')} disabled={row.status !== 'PENDING' || purchaseActionBusy===row.id} className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">Approve</button>
													<button onClick={() => act(row.id, 'REJECT')} disabled={row.status !== 'PENDING' || purchaseActionBusy===row.id} className="px-3 py-1 rounded bg-yellow-600 text-white disabled:opacity-50">Reject</button>
													<button onClick={() => act(row.id, 'DELETE')} disabled={purchaseActionBusy===row.id} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50">Delete</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{showProductPagination && (
								<div className="flex flex-col items-center py-4 border-t">
									<div className="text-sm text-gray-600 mb-3 text-center">
										Showing {formatPageRange(startProductIndex, endProductIndex, filteredPurchaseRows.length)} purchases
									</div>
									<div className="flex items-center space-x-2">
										<button 
											onClick={() => setProductPage(prev => Math.max(1, prev - 1))} 
											disabled={productPage === 1} 
											className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100 transition-colors"
										>
											← Previous
										</button>
										<span className="px-3 py-1.5 text-sm text-gray-600 font-medium bg-gray-50 rounded">
											{productPage} / {totalProductPages}
										</span>
										<button 
											onClick={() => setProductPage(prev => Math.min(totalProductPages, prev + 1))} 
											disabled={productPage === totalProductPages} 
											className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100 transition-colors"
										>
											Next →
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{activeTab === 'others' && (
					<div className="p-4">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-medium">Other Expenses (Daily)</h2>
							<button onClick={() => setExpenseModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">+ Add Expense</button>
						</div>
						{/* Filters */}
						<div className="bg-gray-50 border rounded-md p-3 mb-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-gray-700">Filters</span>
								<button onClick={()=>{setExpensePage(1); setExpenseFilter({ q:"", category:"All", startDate:"", endDate:"" });}} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100">Reset</button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
									<input value={expenseFilter.q} onChange={(e)=>{setExpensePage(1); setExpenseFilter({...expenseFilter, q:e.target.value});}} placeholder="Title, Person or Category" className="w-full px-3 py-2 border rounded-md bg-white" />
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
									<select value={expenseFilter.category} onChange={(e)=>{setExpensePage(1); setExpenseFilter({...expenseFilter, category:e.target.value});}} className="w-full px-3 py-2 border rounded-md bg-white">
										<option value="All">All</option>
										{expenseCategories.map(c => (<option key={c} value={c}>{c}</option>))}
									</select>
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
									<input type="date" value={expenseFilter.startDate} onChange={(e)=>{setExpensePage(1); setExpenseFilter({...expenseFilter, startDate:e.target.value});}} className="w-full px-3 py-2 border rounded-md bg-white" />
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
									<input type="date" value={expenseFilter.endDate} onChange={(e)=>{setExpensePage(1); setExpenseFilter({...expenseFilter, endDate:e.target.value});}} className="w-full px-3 py-2 border rounded-md bg-white" />
								</div>
							</div>
						</div>
						<div className="bg-white rounded-lg border overflow-hidden">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TITLE</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EXPENSE BY</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{currentExpenses.length === 0 && (
										<tr>
											<td colSpan={7} className="px-6 py-8 text-center text-gray-500">No expenses added yet</td>
										</tr>
									)}
									{currentExpenses.map((expense) => (
										<tr key={expense.id}>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.title}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category || 'N/A'}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.currency} {expense.amount}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.createdBy}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date ? new Date(expense.date).toLocaleDateString() : '-'}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' : expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
													{expense.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												<div className="flex space-x-2">
													<button onClick={() => openExpenseEdit(expense)} disabled={expense.status !== 'PENDING' || expenseActionBusy===expense.id} className="text-blue-600 hover:text-blue-900 disabled:opacity-50">Edit</button>
													<button onClick={() => handleExpenseAction(expense.id, 'APPROVED')} disabled={expense.status !== 'PENDING' || expenseActionBusy===expense.id} className="text-green-600 hover:text-green-900 disabled:opacity-50">Approve</button>
													<button onClick={() => handleExpenseAction(expense.id, 'REJECTED')} disabled={expense.status !== 'PENDING' || expenseActionBusy===expense.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">Reject</button>
													<button onClick={() => handleExpenseDelete(expense.id)} disabled={expenseActionBusy===expense.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">Delete</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{showExpensePagination && (
								<div className="flex flex-col items-center py-4 border-t">
									<div className="text-sm text-gray-600 mb-3 text-center">
										Showing {formatPageRange(startExpenseIndex, endExpenseIndex, filteredExpenses.length)} expenses
									</div>
									<div className="flex items-center space-x-2">
										<button 
											onClick={() => setExpensePage(prev => Math.max(1, prev - 1))} 
											disabled={expensePage === 1} 
											className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100 transition-colors"
										>
											← Previous
										</button>
										<span className="px-3 py-1.5 text-sm text-gray-600 font-medium bg-gray-50 rounded">
											{expensePage} / {totalExpensePages}
										</span>
										<button 
											onClick={() => setExpensePage(prev => Math.min(totalExpensePages, prev + 1))} 
											disabled={expensePage === totalExpensePages} 
											className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100 transition-colors"
										>
											Next →
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{activeTab === 'metrics' && (
					<div className="p-4">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-lg font-medium">Finance Dashboard</h2>
							<div className="flex gap-4 items-center">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
									<input 
										type="date" 
										value={dateRange.startDate} 
										onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
										className="px-3 py-2 border rounded-md text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
									<input 
										type="date" 
										value={dateRange.endDate} 
										onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
										className="px-3 py-2 border rounded-md text-sm"
									/>
								</div>
							</div>
						</div>

						{/* Summary Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
							<div className="bg-white p-4 rounded-lg border shadow-sm">
								<div className="text-sm text-gray-600">Total Expenses</div>
								<div className="text-2xl font-bold text-gray-900">
									{metrics ? `৳${metrics.totalAmount.toFixed(2)}` : '৳0.00'}
								</div>
								<div className="text-xs text-gray-500">
									{metrics ? `${metrics.totalCount} transactions` : '0 transactions'}
								</div>
							</div>
							<div className="bg-white p-4 rounded-lg border shadow-sm">
								<div className="text-sm text-gray-600">Product Purchases</div>
								<div className="text-2xl font-bold text-indigo-600">
									{metrics ? `৳${metrics.details.productPurchases.totalAmount.toFixed(2)}` : '৳0.00'}
								</div>
								<div className="text-xs text-gray-500">
									{metrics ? `${metrics.details.productPurchases.totalCount} purchases` : ''}
								</div>
							</div>
							<div className="bg-white p-4 rounded-lg border shadow-sm">
								<div className="text-sm text-gray-600">Other Expenses</div>
								<div className="text-2xl font-bold text-rose-600">
									{metrics ? `৳${metrics.details.otherExpenses.totalAmount.toFixed(2)}` : '৳0.00'}
								</div>
								<div className="text-xs text-gray-500">
									{metrics ? `${metrics.details.otherExpenses.totalCount} transactions` : ''}
								</div>
							</div>
							<div className="bg-white p-4 rounded-lg border shadow-sm">
								<div className="text-sm text-gray-600">Today</div>
								<div className="text-2xl font-bold text-blue-600">
									{metrics ? `৳${metrics.timeMetrics.today.toFixed(2)}` : '৳0.00'}
								</div>
								<div className="text-xs text-gray-500">Today's expenses</div>
							</div>
						</div>

						{/* Time Comparison */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
							<div className="bg-white p-4 rounded-lg border shadow-sm">
								<h3 className="text-lg font-medium mb-3">Time Comparison</h3>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Yesterday:</span>
										<span className="font-medium">৳{metrics?.timeMetrics.yesterday.toFixed(2) || '0.00'}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Last Month:</span>
										<span className="font-medium">৳{metrics?.timeMetrics.lastMonth.toFixed(2) || '0.00'}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">This Year:</span>
										<span className="font-medium">৳{metrics?.timeMetrics.thisYear.toFixed(2) || '0.00'}</span>
									</div>
								</div>
							</div>
							
							<div className="bg-white p-4 rounded-lg border shadow-sm">
								<h3 className="text-lg font-medium mb-3">Date Range</h3>
								<div className="text-sm text-gray-600">
                                    {metrics?.dateRange.start ? 
                                        `${new Date(metrics.dateRange.start).toLocaleDateString()} - ${new Date(metrics.dateRange.end).toLocaleDateString()}` : 'Full year view'
                                    }
                                </div>
 							</div>
 						</div>
 					</div>
 				)}

				{/* Add Expense Modal */}
				{expenseModalOpen && (
					<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
						<div className="bg-white rounded-md p-4 w-full max-w-md">
							<h3 className="text-lg font-medium mb-3">Add Expense</h3>
							<div className="grid grid-cols-1 gap-3">
								<input className="border rounded px-3 py-2" placeholder="Title" value={expenseForm.title} onChange={(e)=>setExpenseForm({...expenseForm, title:e.target.value})} />
								<select className="border rounded px-3 py-2" value={expenseForm.category} onChange={(e)=>setExpenseForm({...expenseForm, category:e.target.value})}>
									{expenseCategories.map(c => (<option key={c} value={c}>{c}</option>))}
								</select>
								<input className="border rounded px-3 py-2" type="number" placeholder="Amount" value={expenseForm.amount} onChange={(e)=>setExpenseForm({...expenseForm, amount: parseFloat(e.target.value||'0')})} />
								<input className="border rounded px-3 py-2" placeholder="Currency" value={expenseForm.currency} onChange={(e)=>setExpenseForm({...expenseForm, currency:e.target.value})} />
								<input className="border rounded px-3 py-2" type="date" value={expenseForm.date} onChange={(e)=>setExpenseForm({...expenseForm, date:e.target.value})} />
								<input className="border rounded px-3 py-2" placeholder="Expense By" value={expenseForm.createdBy} onChange={(e)=>setExpenseForm({...expenseForm, createdBy:e.target.value})} />
								<textarea className="border rounded px-3 py-2" placeholder="Note" value={expenseForm.note} onChange={(e)=>setExpenseForm({...expenseForm, note:e.target.value})} />
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button onClick={()=>setExpenseModalOpen(false)} className="px-3 py-1.5 rounded border">Cancel</button>
								<button onClick={addExpense} className="px-3 py-1.5 rounded bg-emerald-600 text-white">Save</button>
							</div>
						</div>
					</div>
				)}

				{/* Add Purchased Product Modal */}
				{modalOpen && (
					<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
						<div className="bg-white rounded-md p-4 w-full max-w-md">
							<h3 className="text-lg font-medium mb-3">Add Purchased Product</h3>
							<div className="space-y-3">
								<select className="w-full border rounded px-3 py-2" value={selectedProductId} onChange={(e)=>setSelectedProductId(e.target.value)}>
									<option value="">Select product</option>
									{products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
								</select>
								<div>
									<label className="block text-sm mb-1">Quantity</label>
									<input className="w-full border rounded px-3 py-2" type="number" min={1} value={selectedQuantity} onChange={(e)=>setSelectedQuantity(parseInt(e.target.value||'1'))} />
									{selectedProduct && (
										<div className="mt-2 text-sm text-gray-600">Total: {(selectedProduct.buyPrice * Math.max(1, selectedQuantity||1)).toFixed(2)} {selectedProduct.currency}</div>
									)}
								</div>
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button onClick={()=>setModalOpen(false)} className="px-3 py-1.5 rounded border">Cancel</button>
								<button onClick={addPurchaseRow} className="px-3 py-1.5 rounded bg-emerald-600 text-white">Add</button>
							</div>
						</div>
					</div>
				)}

				{/* Edit Expense Modal */}
				{expenseEditModalOpen && (
					<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
						<div className="bg-white rounded-md p-4 w-full max-w-md">
							<h3 className="text-lg font-medium mb-3">Edit Expense</h3>
							<div className="grid grid-cols-1 gap-3">
								<input className="border rounded px-3 py-2" placeholder="Title" value={expenseEditForm.title} onChange={(e)=>setExpenseEditForm({...expenseEditForm, title:e.target.value})} />
								<select className="border rounded px-3 py-2" value={expenseEditForm.category} onChange={(e)=>setExpenseEditForm({...expenseEditForm, category:e.target.value})}>
									{expenseCategories.map(c => (<option key={c} value={c}>{c}</option>))}
								</select>
								<input className="border rounded px-3 py-2" type="number" placeholder="Amount" value={expenseEditForm.amount} onChange={(e)=>setExpenseEditForm({...expenseEditForm, amount: parseFloat(e.target.value||'0')})} />
								<input className="border rounded px-3 py-2" placeholder="Currency" value={expenseEditForm.currency} onChange={(e)=>setExpenseEditForm({...expenseEditForm, currency:e.target.value})} />
								<input className="border rounded px-3 py-2" type="date" value={expenseEditForm.date} onChange={(e)=>setExpenseEditForm({...expenseEditForm, date:e.target.value})} />
								<input className="border rounded px-3 py-2" placeholder="Expense By" value={expenseEditForm.createdBy} onChange={(e)=>setExpenseEditForm({...expenseEditForm, createdBy:e.target.value})} />
								<textarea className="border rounded px-3 py-2" placeholder="Note" value={expenseEditForm.note} onChange={(e)=>setExpenseEditForm({...expenseEditForm, note:e.target.value})} />
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button onClick={()=>setExpenseEditModalOpen(false)} className="px-3 py-1.5 rounded border">Cancel</button>
								<button onClick={saveExpenseEdit} className="px-3 py-1.5 rounded bg-emerald-600 text-white">Save</button>
							</div>
						</div>
					</div>
				)}

				{/* Edit Purchase Modal */}
				{editModalOpen && (
					<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
						<div className="bg-white rounded-md p-4 w-full max-w-md">
							<h3 className="text-lg font-medium mb-3">Edit Purchase</h3>
							<div className="space-y-3">
								<div>
									<label className="block text-sm mb-1">Quantity</label>
									<input className="w-full border rounded px-3 py-2" type="number" min={1} value={editQuantity} onChange={(e)=>setEditQuantity(parseInt(e.target.value||'1'))} />
								</div>
								<div>
									<label className="block text-sm mb-1">Note</label>
									<textarea className="w-full border rounded px-3 py-2" value={editNote} onChange={(e)=>setEditNote(e.target.value)} />
								</div>
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button onClick={()=>setEditModalOpen(false)} className="px-3 py-1.5 rounded border">Cancel</button>
								<button onClick={saveEdit} className="px-3 py-1.5 rounded bg-emerald-600 text-white">Save</button>
							</div>
						</div>
					</div>
				)}

 			</div>
 		</div>
 	);
 }