import { AdminPageHeader } from "@/components/admin/page-header";
import { ApproveRequestButton } from "@/components/admin/approve-request-button";
import { RejectRequestButton } from "@/components/admin/reject-request-button";
import { Card } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { servicePackages } from "@/lib/mock-data";
import { listRequests } from "@/lib/request-store";
import { formatDateTime } from "@/lib/format";

// Đọc dữ liệu thật từ database ở mỗi lần truy cập, không prerender lúc build.
export const dynamic = "force-dynamic";

function formatVnd(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function packageLabel(id: string) {
  return servicePackages.find((p) => p.id === id)?.name ?? id;
}

export default async function AdminRequestsPage() {
  const requests = await listRequests();

  return (
    <>
      <AdminPageHeader
        title="Yêu cầu"
        description="Danh sách yêu cầu báo giá gửi từ trang chủ, chờ đội ngũ duyệt. Duyệt sẽ gửi link đăng nhập cho khách; Từ chối sẽ xóa vĩnh viễn yêu cầu."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khách</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Gói dịch vụ</TableHead>
              <TableHead>Báo giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Chưa có yêu cầu báo giá nào.
                </TableCell>
              </TableRow>
            )}
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">
                  {req.fullName || <span className="text-muted-foreground">(chưa có tên)</span>}
                </TableCell>
                <TableCell>{req.email}</TableCell>
                <TableCell>{packageLabel(req.package)}</TableCell>
                <TableCell>{formatVnd(req.quoteVnd)}</TableCell>
                <TableCell>
                  <RequestStatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(req.createdAt)}
                </TableCell>
                <TableCell>
                  {req.status === "cho_duyet" && (
                    <div className="flex items-start justify-end gap-2">
                      <ApproveRequestButton id={req.id} />
                      <RejectRequestButton id={req.id} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
