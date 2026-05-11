export interface EmployeeLink {
  employeeId: string
  lineUserId: string
  linkedAt: string
}

export interface LinkLineUserInput {
  employeeId: string
  lineUserId: string
}

export interface EmployeeLinkStore {
  findByLineUserId(lineUserId: string): Promise<EmployeeLink | null>
  save(link: EmployeeLink): Promise<EmployeeLink>
  deleteByLineUserId(lineUserId: string): Promise<void>
}

export function createInMemoryEmployeeLinkStore(initialLinks: EmployeeLink[] = []): EmployeeLinkStore {
  const linksByLineUserId = new Map(initialLinks.map((link) => [link.lineUserId, link]))

  return {
    async findByLineUserId(lineUserId) {
      return linksByLineUserId.get(lineUserId) ?? null
    },
    async save(link) {
      linksByLineUserId.set(link.lineUserId, link)
      return link
    },
    async deleteByLineUserId(lineUserId) {
      linksByLineUserId.delete(lineUserId)
    },
  }
}

export async function linkLineUserToEmployee(
  store: EmployeeLinkStore,
  input: LinkLineUserInput,
): Promise<EmployeeLink> {
  const link: EmployeeLink = {
    employeeId: input.employeeId,
    lineUserId: input.lineUserId,
    linkedAt: new Date().toISOString(),
  }

  return store.save(link)
}

export async function unlinkLineUser(store: EmployeeLinkStore, lineUserId: string): Promise<void> {
  await store.deleteByLineUserId(lineUserId)
}
