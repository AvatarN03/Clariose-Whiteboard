ALTER TABLE "board_shares" ADD COLUMN "recipient_user_id" varchar;
CREATE INDEX "board_shares_recipient_user_idx" ON "board_shares" USING btree ("recipient_user_id");
