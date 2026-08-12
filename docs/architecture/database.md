# Database Design

## Overview

This document outlines the expected database structure for the TITAN application.

## Core Entities

### Users

- id
- name
- email
- password_hash
- created_at
- updated_at

### Resumes

- id
- user_id
- file_name
- storage_url
- extracted_text
- created_at

### Interviews

- id
- user_id
- job_role
- difficulty
- status
- started_at
- completed_at

### InterviewAnswers

- id
- interview_id
- question_id
- answer_text
- created_at

### Reports

- id
- user_id
- interview_id
- score
- summary
- strengths
- improvements
- created_at

## Relationships

- One user can have many resumes
- One user can have many interviews
- One interview can have many answers
- One interview can have one report

## Storage Recommendations

- Use a relational database for core transactional data
- Store files in object storage or a document store
- Keep structured metadata in the database

## Example Stack

- PostgreSQL for relational data
- Prisma or Sequelize for ORM
- Cloud object storage for uploaded resumes and transcripts

## Data Integrity Guidelines

- Enforce foreign keys between related records
- Validate required fields before writes
- Use timestamps on create/update events
- Keep sensitive user data encrypted at rest where appropriate
