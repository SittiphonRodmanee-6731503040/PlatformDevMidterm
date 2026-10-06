export interface Equipment {
  id: string;
  name: string;
  location: string;
}

export interface Booking {
  id: string;
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose: string | null;
  createdAt: string;
}

export interface BookingInput {
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose?: string | null;
}
