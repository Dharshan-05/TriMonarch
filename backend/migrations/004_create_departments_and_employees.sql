-- UP
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_departments_org_code UNIQUE (organization_id, code)
);

CREATE INDEX idx_departments_organization_id ON departments(organization_id);

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_title VARCHAR(100),
  employment_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave')),
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_employees_org_code UNIQUE (organization_id, employee_code)
);

CREATE INDEX idx_employees_organization_id ON employees(organization_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
DROP TABLE IF EXISTS employees CASCADE;
DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
DROP TABLE IF EXISTS departments CASCADE;
