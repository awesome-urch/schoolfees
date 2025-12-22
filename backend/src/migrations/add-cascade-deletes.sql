-- Migration: Add CASCADE and SET NULL to foreign key constraints
-- Purpose: Allow deleting students/classes even with related records
-- Date: 2025-12-22

-- Drop existing foreign key constraints that need to be updated
ALTER TABLE `payments` 
  DROP FOREIGN KEY IF EXISTS `FK_9fd5d6ef620b0140a67ff2d95c4`;  -- student_id

ALTER TABLE `payments` 
  DROP FOREIGN KEY IF EXISTS `FK_e1f084b0c8c7e4c1d61a27f79f5`;  -- school_id (if exists)

ALTER TABLE `payments` 
  DROP FOREIGN KEY IF EXISTS `FK_fee_type`;  -- fee_type_id (if exists)

ALTER TABLE `payments` 
  DROP FOREIGN KEY IF EXISTS `FK_session`;  -- session_id (if exists)

ALTER TABLE `students` 
  DROP FOREIGN KEY IF EXISTS `FK_class_id`;  -- class_id (if exists)

ALTER TABLE `students` 
  DROP FOREIGN KEY IF EXISTS `FK_student_school`;  -- school_id (if exists)

ALTER TABLE `fee_types` 
  DROP FOREIGN KEY IF EXISTS `FK_feetype_class`;  -- class_id (if exists)

ALTER TABLE `fee_types` 
  DROP FOREIGN KEY IF EXISTS `FK_feetype_session`;  -- session_id (if exists)

ALTER TABLE `fee_types` 
  DROP FOREIGN KEY IF EXISTS `FK_feetype_school`;  -- school_id (if exists)

ALTER TABLE `classes` 
  DROP FOREIGN KEY IF EXISTS `FK_class_school`;  -- school_id (if exists)

-- Add new foreign key constraints with proper CASCADE/SET NULL behavior

-- Payments table: CASCADE delete when student/school/fee deleted, SET NULL when session deleted
ALTER TABLE `payments`
  ADD CONSTRAINT `FK_payments_student` 
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  ADD CONSTRAINT `FK_payments_school` 
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  ADD CONSTRAINT `FK_payments_fee_type` 
    FOREIGN KEY (`fee_type_id`) REFERENCES `fee_types` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  ADD CONSTRAINT `FK_payments_session` 
    FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Students table: CASCADE when school deleted, SET NULL when class deleted
ALTER TABLE `students`
  ADD CONSTRAINT `FK_students_school` 
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  ADD CONSTRAINT `FK_students_class` 
    FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Fee Types table: CASCADE when school deleted, SET NULL when session/class deleted
ALTER TABLE `fee_types`
  ADD CONSTRAINT `FK_fee_types_school` 
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  ADD CONSTRAINT `FK_fee_types_session` 
    FOREIGN KEY (`session_id`) REFERENCES `academic_sessions` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  
  ADD CONSTRAINT `FK_fee_types_class` 
    FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Classes table: CASCADE when school deleted
ALTER TABLE `classes`
  ADD CONSTRAINT `FK_classes_school` 
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- SUMMARY OF CASCADE BEHAVIOR:
-- ============================================================
-- 
-- DELETE STUDENT → All their PAYMENTS are deleted automatically ✅
-- DELETE CLASS → Student.class_id and FeeType.class_id are set to NULL ✅
-- DELETE SCHOOL → All related Classes, Students, FeeTypes, Payments are deleted ✅
-- DELETE FEE TYPE → All related Payments are deleted ✅
-- DELETE SESSION → Payment.session_id and FeeType.session_id are set to NULL ✅
-- 
-- ============================================================

