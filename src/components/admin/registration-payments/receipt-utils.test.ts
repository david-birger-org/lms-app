import { describe, expect, test } from "bun:test";

import { getReceiptFile } from "@/components/admin/registration-payments/receipt-utils";

describe("getReceiptFile", () => {
  test("prefers tax.gov.ua receipt urls", () => {
    expect(
      getReceiptFile({
        checkFile: "673503c6-5407-4044-a12f-d248b7dfd942",
        checkTaxUrl: "https://cabinet.tax.gov.ua/cashregs/check?id=abc",
      }),
    ).toEqual({
      kind: "url",
      value: "https://cabinet.tax.gov.ua/cashregs/check?id=abc",
    });
  });

  test("does not treat bare file ids as app links", () => {
    expect(
      getReceiptFile({
        checkFile: "24246b45-be85-45e6-b46d-1fb812f325f1",
      }),
    ).toBeUndefined();
  });

  test("accepts pdf data urls as downloadable receipts", () => {
    expect(
      getReceiptFile({
        checkFile: "data:application/pdf;base64,JVBERi0xLjQK",
      }),
    ).toEqual({
      kind: "pdf",
      value: "data:application/pdf;base64,JVBERi0xLjQK",
    });
  });
});
