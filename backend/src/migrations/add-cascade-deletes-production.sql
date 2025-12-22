-- ============================================================
-- Migration: Add CASCADE and SET NULL to foreign key constraints
-- Purpose: Allow deleting students/classes even with related records
-- Date: 2025-12-22
-- 
-- IMPORTANT: Run this ONCE in production database
-- ============================================================

-- Drop existing foreign key constraints
-- Note: If a constraint doesn't exist, you'll get an error - that's OK, just continue

ALTER TABLE `payments` DROP FOREIGN KEY `FK_9fd5d6ef620b0140a67ff2d95c4`;
ALTER TABLE `payments` DROP FOREIGN KEY `FK_2903a85d0b818dfc9940b32b527`;
ALTER TABLE `payments` DROP FOREIGN KEY `FK_ad97f800a0aa059f33a9d8a00e8`;
ALTER TABLE `payments` DROP FOREIGN KEY `FK_b61ceb7c34c6de400d731bbdb41`;

ALTER TABLE `students` DROP FOREIGN KEY `FK_de6ad4ae6936dce474e2823984e`;
ALTER TABLE `students` DROP FOREIGN KEY `FK_aa8edc7905ad764f85924569647`;

ALTER TABLE `fee_types` DROP FOREIGN KEY `FK_326f5118688fc0e67de6c267d02`;
ALTER TABLE `fee_types` DROP FOREIGN KEY `FK_377705b25a7e03a98f8e9245273`;
ALTER TABLE `fee_types` DROP FOREIGN KEY `FK_6b2120f86bce09409d0a4a5fc95`;

ALTER TABLE `classes` DROP FOREIGN KEY `FK_398f3990f5da4a1efda173f576f`;

-- Add new foreign key constraints with CASCADE/SET NULL behavior

-- Payments: CASCADE delete when parent is deleted, SET NULL for session
ALTER TABLE `payments`
  ADD CONSTRAINT `FK_2903a85d0b818dfc9940b32b527` 
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) 
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `payments`
  ADD CONSTRAINT `FK_9fd5d6ef620b0140a67ff2d95c4` 
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) 
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `payments`
  ADD CONSTRAINT `FK_ad97f800a0aa059f33a9d8a00e8` 
    FOREIGN KEY (`fee_type_id`) REFERENCES `fee_types`(`id`) 
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `payments`
  ADD CONSTRAINT `FK_b61ceb7c34c6de400d731bbdb41` 
    FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) 
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Students: CASCADE for school, SET NULL for class
ALTER TABLE `students`
  ADD CONSTRAINT `FK_aa8edc7905ad764f85924569647` 
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) 
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `students`
  ADD CONSTRAINT `FK_de6ad4ae6936dce474e2823984e` 
    FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) 
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Fee Types: CASCADE for school, SET NULL for session and class
ALTER TABLE `fee_types`
  ADD CONSTRAINT `FK_377705b25a7e03a98f8e9245273` 
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) 
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `fee_types`
  ADD CONSTRAINT `FK_6b2120f86bce09409d0a4a5fc95` 
    FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) 
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `fee_types`
  ADD CONSTRAINT `FK_326f5118688fc0e67de6c267d02` 
    FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) 
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Classes: CASCADE for school
ALTER TABLE `classes`
  ADD CONSTRAINT `FK_398f3990f5da4a1efda173f576f` 
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) 
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- ============================================================
-- ✅ MIGRATION COMPLETE!
-- ============================================================
-- 
-- You can now:
-- - Delete students with payments ✅
-- - Delete classes with students/fees (they get set to NULL) ✅
-- - Delete fee types with payments (payments get deleted too) ✅
-- 
-- ============================================================

