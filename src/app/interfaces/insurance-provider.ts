export interface InsuranceProvider {
  id: string;
  name: string;
  address: {
    street: string;
    streetOrBoxNumber: string;
    postalCode: string;
    city: string;
  };
  ikNumber: string;
}
