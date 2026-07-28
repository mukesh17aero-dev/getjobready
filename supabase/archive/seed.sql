insert into target_roles (name, description)
values ('Retail Store Associate', 'Frontline retail role — MVP target');

insert into employability_dimensions (name, category, weight) values
  ('Communication', 'soft_skill', 1.5),
  ('Digital Skills', 'digital', 1.0),
  ('Interview Readiness', 'soft_skill', 1.5),
  ('Workplace Behaviour', 'soft_skill', 1.0),
  ('Professional Profile', 'profile', 0.5);

-- One rule per dimension for the MVP role
insert into readiness_rules (dimension_id, target_role_id, threshold, strong_threshold, min_evidence_count, evidence_validity_days)
select d.dimension_id, r.role_id, 70, 85, 2, 90
from employability_dimensions d
cross join target_roles r;
